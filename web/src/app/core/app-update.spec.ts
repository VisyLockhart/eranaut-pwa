import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppUpdate, UPDATE_CHECK_INTERVAL_MS, UPDATE_CHECK_MIN_GAP_MS } from './app-update';

type Reloader = { reloadPage: ReturnType<typeof vi.fn> };

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

  it('啟用失敗也照樣重新載入', async () => {
    const update = setup();
    sw.activateUpdate.mockRejectedValue(new Error('no update'));
    await update.apply();
    expect((update as unknown as Reloader).reloadPage).toHaveBeenCalledTimes(1);
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
});
