import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast } from './toast';
import { AppUpdate, LIVE_FETCH_TIMEOUT_MS, STARTUP_LIVE_CHECK_DELAY_MS, SW_CALL_TIMEOUT_MS, UPDATE_CHECK_INTERVAL_MS, UPDATE_CHECK_MIN_GAP_MS, mainScriptOf } from './app-update';

type Reloader = { reloadPage: ReturnType<typeof vi.fn> };
type Internals = { loadedMain: string | null; fetchLiveIndex: ReturnType<typeof vi.fn>; resetServiceWorker: ReturnType<typeof vi.fn> };

describe('AppUpdate', () => {
  let versions: Subject<{ type: string }>;
  let unrecoverable: Subject<unknown>;
  let sw: { isEnabled: boolean; versionUpdates: Subject<{ type: string }>; unrecoverable: Subject<unknown>; activateUpdate: ReturnType<typeof vi.fn>; checkForUpdate: ReturnType<typeof vi.fn> };

  function setup(enabled = true): AppUpdate {
    versions = new Subject();
    unrecoverable = new Subject();
    sw = { isEnabled: enabled, versionUpdates: versions, unrecoverable, activateUpdate: vi.fn().mockResolvedValue(true), checkForUpdate: vi.fn().mockResolvedValue(false) };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SwUpdate, useValue: sw }] });
    const update = TestBed.inject(AppUpdate);
    vi.spyOn(update as unknown as Reloader, 'reloadPage').mockImplementation(() => undefined);
    const inner = update as unknown as Internals;
    inner.loadedMain = 'main-AAAA.js';
    inner.fetchLiveIndex = vi.fn().mockResolvedValue('<script src="main-AAAA.js"></script>');
    inner.resetServiceWorker = vi.fn().mockResolvedValue(undefined);
    update.start();
    return update;
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('新版下載好才顯示橫幅,其他事件不顯示', () => {
    const update = setup();
    versions.next({ type: 'VERSION_DETECTED' });
    expect(update.ready()).toBe(false);
    versions.next({ type: 'VERSION_READY' });
    expect(update.ready()).toBe(true);
  });

  it('快取壞掉(unrecoverable)也請使用者更新', () => {
    const update = setup();
    unrecoverable.next({});
    expect(update.ready()).toBe(true);
  });

  it('service worker 沒啟用時什麼都不做', () => {
    const update = setup(false);
    vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS * 2);
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
    expect(update.ready()).toBe(false);
  });

  it('按「立即更新」:先啟用新版再重新載入,連按只做一次', async () => {
    const update = setup();
    await Promise.all([update.apply(), update.apply()]);
    expect(sw.activateUpdate).toHaveBeenCalledTimes(1);
    expect((update as unknown as Reloader).reloadPage).toHaveBeenCalledTimes(1);
    expect(update.applying()).toBe(true);
  });

  it('啟用失敗也照樣重新載入;沒有可啟用的新版時先解除 service worker 並清快取', async () => {
    const update = setup();
    sw.activateUpdate.mockRejectedValue(new Error('no update'));
    await update.apply();
    expect((update as unknown as Internals).resetServiceWorker).toHaveBeenCalledTimes(1);
    expect((update as unknown as Reloader).reloadPage).toHaveBeenCalledTimes(1);
  });

  it('重設 service worker 後用略過 service worker 的方式重載;新版已啟用時普通重載(D-266)', async () => {
    const reset = setup();
    sw.activateUpdate.mockResolvedValue(false);
    await reset.apply();
    expect((reset as unknown as Reloader).reloadPage).toHaveBeenCalledWith(true);
    const ok = setup();
    await ok.apply();
    expect((ok as unknown as Reloader).reloadPage).toHaveBeenCalledWith(false);
  });

  it('載入後把略過 service worker 的參數從網址拿掉(D-266)', () => {
    history.replaceState(null, '', '/craft?ngsw-bypass=1&x=2#h');
    setup();
    expect(location.pathname + location.search + location.hash).toBe('/craft?x=2#h');
    history.replaceState(null, '', '/');
  });

  it('新版已啟用時不清 service worker', async () => {
    const update = setup();
    await update.apply();
    expect((update as unknown as Internals).resetServiceWorker).not.toHaveBeenCalled();
  });

  it('啟用回傳 false(沒有待啟用的版本)也清 service worker', async () => {
    const update = setup();
    sw.activateUpdate.mockResolvedValue(false);
    await update.apply();
    expect((update as unknown as Internals).resetServiceWorker).toHaveBeenCalledTimes(1);
  });

  it('備援:伺服器的主程式檔名和目前不同 → 顯示橫幅(service worker 降級時也能發現新版)', async () => {
    const update = setup();
    (update as unknown as Internals).fetchLiveIndex.mockResolvedValue('<script src="main-BBBB.js" type="module"></script>');
    await vi.advanceTimersByTimeAsync(STARTUP_LIVE_CHECK_DELAY_MS);
    expect(update.ready()).toBe(true);
  });

  it('備援:檔名相同、錯誤頁或抓不到都不顯示橫幅', async () => {
    const update = setup();
    const f = (update as unknown as Internals).fetchLiveIndex;
    await vi.advanceTimersByTimeAsync(STARTUP_LIVE_CHECK_DELAY_MS);
    expect(update.ready()).toBe(false);
    f.mockResolvedValue('<html><body>504 Gateway Timeout Ray ID: abc</body></html>');
    vi.setSystemTime(Date.now() + UPDATE_CHECK_MIN_GAP_MS + 1000);
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(10);
    expect(update.ready()).toBe(false);
    f.mockResolvedValue('');
    await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL_MS);
    expect(update.ready()).toBe(false);
  });

  it('備援:視窗取得焦點、隔夠久時也會問伺服器', async () => {
    const update = setup();
    const f = (update as unknown as Internals).fetchLiveIndex;
    f.mockResolvedValue('<script src="main-CCCC.js"></script>');
    vi.setSystemTime(Date.now() + UPDATE_CHECK_MIN_GAP_MS + 1000);
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(10);
    expect(update.ready()).toBe(true);
  });

  describe('手動檢查更新', () => {
    it('SW 找到新版 → available,顯示橫幅;不清 service worker、不重新載入', async () => {
      const update = setup();
      sw.checkForUpdate.mockResolvedValue(true);
      expect(await update.checkNow()).toBe('available');
      expect(update.ready()).toBe(true);
      expect((update as unknown as Internals).resetServiceWorker).not.toHaveBeenCalled();
      expect((update as unknown as Reloader).reloadPage).not.toHaveBeenCalled();
    });

    it('SW 沒新版、伺服器主程式相同 → latest', async () => {
      const update = setup();
      expect(await update.checkNow()).toBe('latest');
      expect(update.ready()).toBe(false);
      expect(update.checking()).toBe(false);
    });

    it('SW 降級(丟錯)但伺服器已有新版 → available(直接問伺服器)', async () => {
      const update = setup();
      sw.checkForUpdate.mockRejectedValue(new Error('degraded'));
      (update as unknown as Internals).fetchLiveIndex.mockResolvedValue('<script src="main-NEW1.js"></script>');
      expect(await update.checkNow()).toBe('available');
      expect(update.ready()).toBe(true);
    });

    it('連不上伺服器或回錯誤頁 → failed,不誤報新版', async () => {
      const update = setup();
      const f = (update as unknown as Internals).fetchLiveIndex;
      f.mockResolvedValue('');
      expect(await update.checkNow()).toBe('failed');
      f.mockResolvedValue('<html>504 Gateway Timeout</html>');
      expect(await update.checkNow()).toBe('failed');
      expect(update.ready()).toBe(false);
    });

    it('已經有橫幅時直接回 available;檢查中連按只做一次', async () => {
      const update = setup();
      versions.next({ type: 'VERSION_READY' });
      expect(await update.checkNow()).toBe('available');
      expect(sw.checkForUpdate).not.toHaveBeenCalled();
      const fresh = setup();
      const [a, b] = [fresh.checkNow(), fresh.checkNow()];
      expect(fresh.checking()).toBe(true);
      await Promise.all([a, b]);
      expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
      expect(fresh.checking()).toBe(false);
    });

    it('checkAndNotify 依結果顯示提示', async () => {
      const update = setup();
      const toast = TestBed.inject(Toast);
      await update.checkAndNotify();
      expect(toast.items().at(-1)?.text).toBe('已是最新版本');
      sw.checkForUpdate.mockResolvedValue(true);
      await update.checkAndNotify();
      expect(toast.items().at(-1)?.text).toContain('立即更新');
      const other = setup();
      (other as unknown as Internals).fetchLiveIndex.mockResolvedValue('');
      await other.checkAndNotify();
      expect(TestBed.inject(Toast).items().at(-1)).toMatchObject({ tone: 'warn' });
    });

    it('supported:service worker 啟用才為 true', () => {
      expect(setup(true).supported).toBe(true);
      expect(setup(false).supported).toBe(false);
    });
  });

  it('從 index.html 或 src 取出主程式檔名', () => {
    expect(mainScriptOf('<script src="main-XG5FWGKL.js" type="module"></script>')).toBe('main-XG5FWGKL.js');
    expect(mainScriptOf('main-a_b-9.js')).toBe('main-a_b-9.js');
    expect(mainScriptOf('<html>504</html>')).toBeNull();
    expect(mainScriptOf('')).toBeNull();
  });

  it('App 開著時定時檢查新版', async () => {
    setup();
    await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL_MS);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL_MS);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('回到前景:隔夠久才檢查,太頻繁不檢查', () => {
    setup();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
    vi.setSystemTime(Date.now() + UPDATE_CHECK_MIN_GAP_MS + 1000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('視窗取得焦點:同樣隔夠久才檢查;與回到前景同時發生只檢查一次', () => {
    setup();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    window.dispatchEvent(new Event('focus'));
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
    vi.setSystemTime(Date.now() + UPDATE_CHECK_MIN_GAP_MS + 1000);
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('service worker 沒回應(SAFE_MODE)時不會卡住(D-266)', () => {
  let versions: Subject<{ type: string }>;
  let sw: { isEnabled: boolean; versionUpdates: Subject<{ type: string }>; unrecoverable: Subject<unknown>; activateUpdate: ReturnType<typeof vi.fn>; checkForUpdate: ReturnType<typeof vi.fn> };
  const never = () => new Promise<boolean>(() => undefined);

  function setup(live = '<script src="main-AAAA.js"></script>'): AppUpdate {
    versions = new Subject();
    // 模擬 SAFE_MODE:檢查與啟用都永遠不回覆
    sw = { isEnabled: true, versionUpdates: versions, unrecoverable: new Subject(), activateUpdate: vi.fn(never), checkForUpdate: vi.fn(never) };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SwUpdate, useValue: sw }] });
    const update = TestBed.inject(AppUpdate);
    vi.spyOn(update as unknown as Reloader, 'reloadPage').mockImplementation(() => undefined);
    const inner = update as unknown as Internals;
    inner.loadedMain = 'main-AAAA.js';
    inner.fetchLiveIndex = vi.fn().mockResolvedValue(live);
    inner.resetServiceWorker = vi.fn().mockResolvedValue(undefined);
    update.start();
    return update;
  }
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('手動檢查:逾時後仍以伺服器為準;伺服器有新版 → 橫幅,按鈕恢復', async () => {
    const update = setup('<script src="main-BBBB.js"></script>');
    const p = update.checkNow();
    expect(update.checking()).toBe(true);
    await vi.advanceTimersByTimeAsync(SW_CALL_TIMEOUT_MS);
    expect(await p).toBe('available');
    expect(update.ready()).toBe(true);
    expect(update.checking()).toBe(false);
  });

  it('手動檢查:伺服器沒有新版 → latest,按鈕恢復;之後不再等沒回應的 service worker', async () => {
    const update = setup();
    const p = update.checkNow();
    await vi.advanceTimersByTimeAsync(SW_CALL_TIMEOUT_MS);
    expect(await p).toBe('latest');
    expect(update.checking()).toBe(false);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
    // 第二次:不再呼叫 service worker,立刻就有結果(不必再等逾時)
    expect(await update.checkNow()).toBe('latest');
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('service worker 之後有事件(恢復運作),就再問它', async () => {
    const update = setup();
    const p = update.checkNow();
    await vi.advanceTimersByTimeAsync(SW_CALL_TIMEOUT_MS);
    await p;
    versions.next({ type: 'NO_NEW_VERSION_DETECTED' });
    const p2 = update.checkNow();
    await vi.advanceTimersByTimeAsync(SW_CALL_TIMEOUT_MS);
    await p2;
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('「立即更新」:啟用沒回應 → 逾時後解除 service worker 並重新載入', async () => {
    const update = setup();
    const p = update.apply();
    await vi.advanceTimersByTimeAsync(SW_CALL_TIMEOUT_MS);
    await p;
    expect((update as unknown as Internals).resetServiceWorker).toHaveBeenCalledTimes(1);
    expect((update as unknown as Reloader).reloadPage).toHaveBeenCalledTimes(1);
  });

  it('自動檢查不會疊:service worker 沒回應時,同時湧入的事件只問一次', async () => {
    const update = setup();
    vi.setSystemTime(Date.now() + UPDATE_CHECK_MIN_GAP_MS + 1000);
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(1000);
    vi.setSystemTime(Date.now() + UPDATE_CHECK_MIN_GAP_MS + 1000);
    window.dispatchEvent(new Event('focus'));
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
    expect(update.ready()).toBe(false);
  });

  it('負載:service worker 沒回應時,放一整天,對 service worker 只問 1 次、對伺服器的請求次數 = 啟動 1 次 + 定時檢查次數', async () => {
    const update = setup();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    const f = (update as unknown as Internals).fetchLiveIndex;
    const intervals = Math.floor((24 * 60 * 60 * 1000) / UPDATE_CHECK_INTERVAL_MS);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledTimes(1 + intervals);
    // 計時器都已清掉,只剩定時檢查那一個
    expect(vi.getTimerCount()).toBe(1);
  });

  it('直接問伺服器卡住 → 超過上限就中止,視為抓不到', async () => {
    const update = setup();
    const aborted = vi.fn();
    vi.stubGlobal('fetch', (_u: unknown, init: RequestInit) => new Promise((_res, rej) => init.signal!.addEventListener('abort', () => (aborted(), rej(new DOMException('x', 'AbortError'))))));
    const real = (AppUpdate.prototype as unknown as { fetchLiveIndex(): Promise<string> }).fetchLiveIndex;
    const p = real.call(update);
    await vi.advanceTimersByTimeAsync(LIVE_FETCH_TIMEOUT_MS);
    expect(await p).toBe('');
    expect(aborted).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('service worker 沒回應 → broken;之後有事件就恢復(D-267)', async () => {
    const update = setup();
    expect(update.broken()).toBe(false);
    const p = update.checkNow();
    await vi.advanceTimersByTimeAsync(SW_CALL_TIMEOUT_MS);
    await p;
    expect(update.broken()).toBe(true);
    versions.next({ type: 'NO_NEW_VERSION_DETECTED' });
    expect(update.broken()).toBe(false);
  });

  it('「修復」:解除 service worker、清快取、略過 service worker 重載,連按只做一次;「稍後」收起、再手動檢查會重新顯示', async () => {
    const update = setup();
    const p = update.checkNow();
    await vi.advanceTimersByTimeAsync(SW_CALL_TIMEOUT_MS);
    await p;
    update.dismissBroken();
    expect(update.brokenDismissed()).toBe(true);
    const p2 = update.checkNow();
    expect(update.brokenDismissed()).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    await p2;
    await Promise.all([update.repair(), update.repair()]);
    expect((update as unknown as Internals).resetServiceWorker).toHaveBeenCalledTimes(1);
    expect((update as unknown as Reloader).reloadPage).toHaveBeenCalledTimes(1);
    expect((update as unknown as Reloader).reloadPage).toHaveBeenCalledWith(true);
  });
});
