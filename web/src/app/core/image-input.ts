import { Injectable } from '@angular/core';

/**
 * 更新頁的圖片輸入輔助(D-162):貼上、擷取畫面、超過上限時在瀏覽器端縮圖。
 * 全部在使用者的瀏覽器內完成,圖片不經伺服器暫存(D-126);後端的 10 MB 上限與縮圖流程不變。
 */

/** 前端縮圖的長邊(後端辨識前本來就會再縮到 1280,D-158 ②,這裡只為了壓到上限以下) */
export const SHRINK_MAX_EDGE = 1920;
const SHRINK_QUALITY = [0.9, 0.75, 0.6];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** 依長邊上限等比縮小,不放大;回傳整數像素 */
export function fitSize(width: number, height: number, maxEdge = SHRINK_MAX_EDGE): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxEdge) return { width, height };
  const scale = maxEdge / long;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** 從貼上事件的剪貼簿取出第一張圖片;沒有圖片回 null(例如貼的是文字) */
export function clipboardImage(data: Pick<DataTransfer, 'items'> | null | undefined): File | null {
  const items = data?.items;
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}

/** 貼上時游標在可輸入文字的元素內,就不攔截(讓一般的文字貼上照常運作) */
export function isTextTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = ((el as HTMLInputElement).type || 'text').toLowerCase();
    return !['button', 'checkbox', 'radio', 'file', 'submit', 'reset', 'image', 'range', 'color'].includes(type);
  }
  return false;
}

/** 這個檔案是不是支援的圖片格式(縮圖只處理這幾種) */
export function isImageFile(file: Pick<File, 'type'>): boolean {
  return IMAGE_TYPES.includes(file.type);
}

/** 瀏覽器是否能擷取畫面(`getDisplayMedia`;手機瀏覽器通常沒有) */
export function canCaptureScreen(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function';
}

/** 貼上快速鍵的顯示文字 */
export function pasteShortcut(): string {
  const platform = typeof navigator === 'undefined' ? '' : navigator.platform || navigator.userAgent || '';
  return /Mac|iPhone|iPad/i.test(platform) ? '⌘V' : 'Ctrl+V';
}

function drawToBlob(source: CanvasImageSource, width: number, height: number, quality: number): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality));
}

function jpegName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'screenshot';
  return `${base}.jpg`;
}

/**
 * 在瀏覽器端把圖縮到長邊 {@link SHRINK_MAX_EDGE} 並轉成 JPEG,壓到 `limitBytes` 以下;做不到(環境不支援、
 * 圖片損壞、品質降到底仍太大)回 null,由呼叫端沿用原本的「超過上限」提示。
 */
export async function shrinkImage(file: File, limitBytes: number): Promise<File | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const { width, height } = fitSize(bitmap.width, bitmap.height);
    for (const quality of SHRINK_QUALITY) {
      const blob = await drawToBlob(bitmap, width, height, quality);
      if (blob && blob.size > 0 && blob.size <= limitBytes) return new File([blob], jpegName(file.name), { type: 'image/jpeg' });
    }
    return null;
  } finally {
    bitmap.close();
  }
}

/** 使用者在選擇器按取消(或沒有授權)時的錯誤 */
export function isCaptureCancelled(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name;
  return name === 'NotAllowedError' || name === 'AbortError';
}

/**
 * 擷取畫面(D-162):請瀏覽器讓使用者選一個視窗或螢幕,取當下的一幀,轉成 JPEG 後立刻停止分享。
 * 使用者取消會丟出 NotAllowedError(用 {@link isCaptureCancelled} 判斷)。
 */
export async function captureScreenFrame(limitBytes: number): Promise<File> {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('video_error'));
    });
    await video.play();
    // 剛開始播放的第一幀有時還是空的,等一個畫面更新再取
    await new Promise<void>((resolve) => {
      if ('requestVideoFrameCallback' in video) (video as HTMLVideoElement).requestVideoFrameCallback(() => resolve());
      else setTimeout(resolve, 200);
    });
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) throw new Error('empty_frame');
    for (const quality of [0.92, ...SHRINK_QUALITY]) {
      const blob = await drawToBlob(video, width, height, quality);
      if (blob && blob.size > 0 && blob.size <= limitBytes) return new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
    }
    // 解析度太高、壓到最低品質仍超過上限:縮小再試
    const { width: w, height: h } = fitSize(width, height);
    const blob = await drawToBlob(video, w, h, SHRINK_QUALITY[0]);
    if (blob && blob.size > 0 && blob.size <= limitBytes) return new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
    throw new Error('too_large');
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

/**
 * 更新頁用的圖片工具(縮圖、擷取畫面)。包成可注入的服務,測試時以 TestBed 換成替身
 * (jsdom 沒有 canvas 與螢幕擷取)。
 */
@Injectable({ providedIn: 'root' })
export class ImageTools {
  /** 超過上限時在瀏覽器端縮圖;做不到回 null */
  shrink(file: File, limitBytes: number): Promise<File | null> {
    return shrinkImage(file, limitBytes);
  }
  /** 擷取畫面;使用者取消會丟出 NotAllowedError */
  capture(limitBytes: number): Promise<File> {
    return captureScreenFrame(limitBytes);
  }
  /** 這個瀏覽器能不能擷取畫面 */
  canCapture(): boolean {
    return canCaptureScreen();
  }
}
