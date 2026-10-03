import { afterEach, describe, expect, it, vi } from 'vitest';
import { canCaptureScreen, clipboardImage, fitSize, isCaptureCancelled, isImageFile, isTextTarget, pasteShortcut, shrinkImage } from './image-input';

// 貼上、擷取畫面、前端縮圖的輔助函式(D-162)

const item = (kind: string, type: string, file: File | null) => ({ kind, type, getAsFile: () => file });
const list = (...items: ReturnType<typeof item>[]) => ({ items: Object.assign([...items], { length: items.length }) as unknown as DataTransferItemList });

describe('fitSize', () => {
  it('長邊不超過上限就原樣;超過就等比縮小、不放大', () => {
    expect(fitSize(1280, 720)).toEqual({ width: 1280, height: 720 });
    expect(fitSize(1920, 1080)).toEqual({ width: 1920, height: 1080 });
    expect(fitSize(3840, 2160)).toEqual({ width: 1920, height: 1080 });
    expect(fitSize(1000, 4000, 2000)).toEqual({ width: 500, height: 2000 });
  });
  it('極端細長的圖,短邊至少 1 像素', () => {
    expect(fitSize(100000, 2)).toEqual({ width: 1920, height: 1 });
  });
});

describe('clipboardImage', () => {
  const png = new File(['x'], 'image.png', { type: 'image/png' });
  it('取出第一張圖片;文字或其他檔案略過', () => {
    expect(clipboardImage(list(item('string', 'text/plain', null), item('file', 'image/png', png)))).toBe(png);
    expect(clipboardImage(list(item('file', 'application/pdf', new File(['x'], 'a.pdf')), item('file', 'image/jpeg', png)))).toBe(png);
  });
  it('沒有圖片、剪貼簿是空的、getAsFile 回 null:回 null', () => {
    expect(clipboardImage(list(item('string', 'text/plain', null)))).toBeNull();
    expect(clipboardImage(list(item('file', 'image/png', null)))).toBeNull();
    expect(clipboardImage(list())).toBeNull();
    expect(clipboardImage(null)).toBeNull();
    expect(clipboardImage(undefined)).toBeNull();
  });
});

describe('isTextTarget', () => {
  const make = (tag: string, attrs: Record<string, string> = {}): HTMLElement => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  it('文字輸入框、textarea、select 算;按鈕、核取方塊、檔案欄位、一般元素不算', () => {
    expect(isTextTarget(make('input'))).toBe(true);
    expect(isTextTarget(make('input', { type: 'text' }))).toBe(true);
    expect(isTextTarget(make('input', { type: 'number' }))).toBe(true);
    expect(isTextTarget(make('textarea'))).toBe(true);
    expect(isTextTarget(make('select'))).toBe(true);
    expect(isTextTarget(make('input', { type: 'file' }))).toBe(false);
    expect(isTextTarget(make('input', { type: 'checkbox' }))).toBe(false);
    expect(isTextTarget(make('button'))).toBe(false);
    expect(isTextTarget(make('div'))).toBe(false);
    expect(isTextTarget(document)).toBe(false);
    expect(isTextTarget(null)).toBe(false);
  });
  it('contenteditable 算', () => {
    expect(isTextTarget({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget)).toBe(true);
  });
});

describe('其他小函式', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('isImageFile:只認 PNG / JPEG / WebP', () => {
    expect(isImageFile({ type: 'image/png' })).toBe(true);
    expect(isImageFile({ type: 'image/webp' })).toBe(true);
    expect(isImageFile({ type: 'image/gif' })).toBe(false);
    expect(isImageFile({ type: '' })).toBe(false);
  });

  it('isCaptureCancelled:使用者取消選擇器(NotAllowedError / AbortError)', () => {
    expect(isCaptureCancelled({ name: 'NotAllowedError' })).toBe(true);
    expect(isCaptureCancelled({ name: 'AbortError' })).toBe(true);
    expect(isCaptureCancelled(new Error('x'))).toBe(false);
    expect(isCaptureCancelled(null)).toBe(false);
  });

  it('pasteShortcut:Mac 顯示 ⌘V,其他 Ctrl+V', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: '' });
    expect(pasteShortcut()).toBe('⌘V');
    vi.stubGlobal('navigator', { platform: 'Win32', userAgent: '' });
    expect(pasteShortcut()).toBe('Ctrl+V');
  });

  it('canCaptureScreen:有 getDisplayMedia 才算', () => {
    vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia: () => Promise.resolve({}) } });
    expect(canCaptureScreen()).toBe(true);
    vi.stubGlobal('navigator', { mediaDevices: {} });
    expect(canCaptureScreen()).toBe(false);
    vi.stubGlobal('navigator', {});
    expect(canCaptureScreen()).toBe(false);
  });
});

describe('shrinkImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const big = new File([new Uint8Array(8)], 'shot.png', { type: 'image/png' });

  /** 假的 canvas:依序回傳指定大小的 blob,並記錄畫布尺寸與品質 */
  function stubCanvas(sizes: number[]) {
    const calls: { width: number; height: number; quality: number }[] = [];
    let i = 0;
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: () => undefined }), toBlob: (cb: (b: Blob | null) => void, _type: string, quality: number) => {
      calls.push({ width: canvas.width, height: canvas.height, quality });
      const size = sizes[Math.min(i++, sizes.length - 1)];
      cb(size < 0 ? null : new Blob([new Uint8Array(size)], { type: 'image/jpeg' }));
    } };
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => (tag === 'canvas' ? canvas : Object.getPrototypeOf(document).createElement.call(document, tag))) as typeof document.createElement);
    return calls;
  }
  const stubBitmap = (width: number, height: number) => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width, height, close })));
    return close;
  };

  it('環境不支援 createImageBitmap:回 null', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    expect(await shrinkImage(big, 100)).toBeNull();
  });

  it('圖片無法解碼:回 null', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => { throw new Error('bad'); }));
    expect(await shrinkImage(big, 100)).toBeNull();
  });

  it('縮到長邊 1920、轉成 JPEG,第一次就小於上限就用第一次的品質', async () => {
    const close = stubBitmap(3840, 2160);
    const calls = stubCanvas([50]);
    const out = await shrinkImage(big, 100);
    expect(out).not.toBeNull();
    expect(out!.type).toBe('image/jpeg');
    expect(out!.name).toBe('shot.jpg');
    expect(out!.size).toBe(50);
    expect(calls).toEqual([{ width: 1920, height: 1080, quality: 0.9 }]);
    expect(close).toHaveBeenCalled();
  });

  it('太大就逐步降低品質', async () => {
    stubBitmap(3000, 1000);
    const calls = stubCanvas([500, 300, 80]);
    const out = await shrinkImage(big, 100);
    expect(out!.size).toBe(80);
    expect(calls.map((c) => c.quality)).toEqual([0.9, 0.75, 0.6]);
  });

  it('品質降到底仍太大、或編碼失敗:回 null', async () => {
    stubBitmap(3000, 1000);
    stubCanvas([500]);
    expect(await shrinkImage(big, 100)).toBeNull();
    vi.restoreAllMocks();
    stubBitmap(3000, 1000);
    stubCanvas([-1]);
    expect(await shrinkImage(big, 100)).toBeNull();
  });
});
