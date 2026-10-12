import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppUpdate, STARTUP_LIVE_CHECK_DELAY_MS, UPDATE_CHECK_INTERVAL_MS, UPDATE_CHECK_MIN_GAP_MS, mainScriptOf } from './app-update';

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

  it('從 index.html 或 src 取出主程式檔名', () => {
    expect(mainScriptOf('<script src="main-XG5FWGKL.js" type="module"></script>')).toBe('main-XG5FWGKL.js');
    expect(mainScriptOf('main-a_b-9.js')).toBe('main-a_b-9.js');
    expect(mainScriptOf('<html>504</html>')).toBeNull();
    expect(mainScriptOf('')).toBeNull();
  });

  it('App 開著時定時檢查新版', () => {
    setup();
    vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
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
