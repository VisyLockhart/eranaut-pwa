import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from './auth';
import { PushEnv } from './push-env';
import { PushVm } from './push-vm';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const EP = 'https://push.example.com/send/aaa';

class FakeEnv {
  ios = false;
  standalone = false;
  api = true;
  perm: NotificationPermission = 'default';
  asked: NotificationPermission = 'granted';
  isIos = () => this.ios;
  isStandalone = () => this.standalone;
  hasPushApi = () => this.api;
  permission = () => this.perm;
  requestPermission = vi.fn(async () => this.asked);
}

function fakeSub(endpoint = EP): PushSubscription {
  return { endpoint, toJSON: () => ({ endpoint, keys: { p256dh: 'pk', auth: 'au' } }) } as unknown as PushSubscription;
}

class FakeSw {
  isEnabled = true;
  subscription = new BehaviorSubject<PushSubscription | null>(null);
  requestSubscription = vi.fn(async (_o: { serverPublicKey: string }) => {
    const s = fakeSub();
    this.subscription.next(s);
    return s;
  });
  unsubscribe = vi.fn(async () => this.subscription.next(null));
}

describe('PushVm(D-165)', () => {
  let http: HttpTestingController;
  let env: FakeEnv;
  let sw: FakeSw;

  function setup(opts: { sw?: boolean } = {}): PushVm {
    TestBed.resetTestingModule();
    env = new FakeEnv();
    sw = new FakeSw();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PushEnv, useValue: env },
        ...(opts.sw === false ? [] : [{ provide: SwPush, useValue: sw }]),
      ],
    });
    if (opts.sw === false) sw.isEnabled = false; // 沒註冊 service worker:load() 不會去問訂閱
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    return TestBed.inject(PushVm);
  }

  /** 載入:回應 config 與已登記的端點 */
  async function load(vm: PushVm, publicKey: string | null = 'PUBKEY', endpoints: string[] = []): Promise<void> {
    const p = vm.load();
    http.expectOne('/api/push/config').flush({ publicKey });
    await settle();
    if (publicKey !== null && !(env.ios && !env.standalone) && env.api && sw.isEnabled) http.expectOne('/api/push/subscriptions').flush({ endpoints });
    await p;
  }

  it('伺服器沒設定推播:unavailable(不管什麼平台)', async () => {
    const vm = setup();
    env.ios = true;
    await load(vm, null);
    expect(vm.state()).toBe('unavailable');
  });

  it('iPhone 不是從主畫面開啟:ios-install;從主畫面開啟則可用', async () => {
    let vm = setup();
    env.ios = true;
    await load(vm);
    expect(vm.state()).toBe('ios-install');
    vm = setup();
    env.ios = true;
    env.standalone = true;
    await load(vm);
    expect(vm.state()).toBe('ready');
  });

  it('沒有 service worker 或瀏覽器沒有推播 API:unsupported', async () => {
    let vm = setup({ sw: false });
    await load(vm);
    expect(vm.state()).toBe('unsupported');
    vm = setup();
    env.api = false;
    await load(vm);
    expect(vm.state()).toBe('unsupported');
  });

  it('讀取失敗:error,重試可恢復', async () => {
    const vm = setup();
    const p = vm.load();
    http.expectOne('/api/push/config').flush({}, { status: 500, statusText: 'x' });
    await p;
    expect(vm.state()).toBe('error');
    await load(vm);
    expect(vm.state()).toBe('ready');
  });

  it('通知被封鎖:blocked;但這台已經開著就仍是 ready(可以關)', async () => {
    let vm = setup();
    env.perm = 'denied';
    await load(vm);
    expect(vm.state()).toBe('blocked');
    vm = setup();
    env.perm = 'denied';
    sw.subscription.next(fakeSub());
    await load(vm, 'PUBKEY', [EP]);
    expect(vm.state()).toBe('ready');
    expect(vm.enabled()).toBe(true);
  });

  it('這台是否已開啟:瀏覽器有訂閱而且伺服器也登記了才算', async () => {
    let vm = setup();
    sw.subscription.next(fakeSub());
    await load(vm, 'PUBKEY', [EP]);
    expect(vm.enabled()).toBe(true);
    vm = setup();
    sw.subscription.next(fakeSub());
    await load(vm, 'PUBKEY', ['https://other']);
    expect(vm.enabled()).toBe(false);
    vm = setup();
    await load(vm, 'PUBKEY', [EP]);
    expect(vm.enabled()).toBe(false);
  });

  it('開啟:先要權限、向瀏覽器訂閱(帶公鑰)、登記到伺服器、重新讀取提醒方式', async () => {
    const vm = setup();
    await load(vm);
    const p = vm.enable();
    await settle();
    expect(env.requestPermission).toHaveBeenCalled();
    expect(sw.requestSubscription).toHaveBeenCalledWith({ serverPublicKey: 'PUBKEY' });
    const req = http.expectOne('/api/push/subscription');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ endpoint: EP, keys: { p256dh: 'pk', auth: 'au' } });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(vm.enabled()).toBe(true);
    expect(vm.message()?.kind).toBe('ok');
    http.expectOne('/api/notify-prefs').flush({ dm: true, channel: false, push: true });
  });

  it('使用者不允許通知:不訂閱、不呼叫伺服器;封鎖則轉為 blocked', async () => {
    let vm = setup();
    await load(vm);
    env.asked = 'default';
    await vm.enable();
    expect(sw.requestSubscription).not.toHaveBeenCalled();
    expect(vm.enabled()).toBe(false);
    expect(vm.message()?.kind).toBe('error');
    expect(vm.state()).toBe('ready');
    vm = setup();
    await load(vm);
    env.asked = 'denied';
    await vm.enable();
    expect(vm.state()).toBe('blocked');
    http.expectNone('/api/push/subscription');
  });

  it('伺服器登記失敗:取消瀏覽器訂閱(不留孤兒)並提示', async () => {
    const vm = setup();
    await load(vm);
    const p = vm.enable();
    await settle();
    http.expectOne('/api/push/subscription').flush({ error: 'push_unavailable' }, { status: 503, statusText: 'x' });
    await p;
    expect(sw.unsubscribe).toHaveBeenCalled();
    expect(vm.enabled()).toBe(false);
    expect(vm.message()?.kind).toBe('error');
    expect(vm.busy()).toBe(false);
  });

  it('關閉:先在伺服器移除,再取消瀏覽器訂閱;伺服器失敗就維持開啟', async () => {
    const vm = setup();
    sw.subscription.next(fakeSub());
    await load(vm, 'PUBKEY', [EP]);
    let p = vm.disable();
    await settle();
    let req = http.expectOne('/api/push/subscription');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ endpoint: EP });
    req.flush({}, { status: 500, statusText: 'x' });
    await p;
    expect(vm.enabled()).toBe(true);
    expect(sw.unsubscribe).not.toHaveBeenCalled();
    expect(vm.message()?.kind).toBe('error');

    p = vm.disable();
    await settle();
    req = http.expectOne('/api/push/subscription');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(vm.enabled()).toBe(false);
    expect(sw.unsubscribe).toHaveBeenCalled();
    http.expectOne('/api/notify-prefs').flush({ dm: true, channel: false, push: false });
  });

  it('測試通知:成功顯示裝置數;404 / 429 / 502 各有說明', async () => {
    const vm = setup();
    await load(vm);
    const run = async (status: number, body: object) => {
      const p = vm.test();
      http.expectOne('/api/push/test').flush(body, status === 200 ? undefined : { status, statusText: 'x' });
      await p;
    };
    await run(200, { sent: 2 });
    expect(vm.message()).toEqual({ kind: 'ok', text: expect.stringContaining('2 台裝置') });
    await run(429, { error: 'too_fast' });
    expect(vm.message()?.text).toContain('十秒');
    await run(502, { error: 'push_failed' });
    expect(vm.message()?.text).toContain('推播服務');
    vm.enabled.set(true);
    await run(404, { error: 'no_subscription' });
    expect(vm.enabled()).toBe(false);
  });

  it('登出時順手移除這台裝置:伺服器失敗也不丟錯', async () => {
    const vm = setup();
    sw.subscription.next(fakeSub());
    const p = vm.releaseThisDevice();
    await settle();
    http.expectOne('/api/push/subscription').flush({}, { status: 500, statusText: 'x' });
    await p;
    expect(sw.unsubscribe).toHaveBeenCalled();
    // 沒有 service worker:什麼都不做
    const vm2 = setup({ sw: false });
    await vm2.releaseThisDevice();
    http.expectNone('/api/push/subscription');
  });
});
