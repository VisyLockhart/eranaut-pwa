import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { LegalPage } from './legal-page';

function mount(kind: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { legal: kind } } } }],
  });
  const f = TestBed.createComponent(LegalPage);
  f.detectChanges();
  return f.nativeElement as HTMLElement;
}

describe('LegalPage(D-308)', () => {
  it('隱私權政策(展示版):沒有後端、資料只在瀏覽器、辨識是模擬的,聯絡走 Discord(不留信箱)', () => {
    const el = mount('privacy');
    const t = el.textContent!;
    expect(el.querySelector('h1')?.textContent).toBe('隱私權政策');
    expect(t).toContain('沒有後端伺服器');
    expect(t).toContain('localStorage');
    expect(t).toContain('Google Fonts');
    expect(t).not.toContain('@gmail');
  });
  it('服務條款:非官方、僅限社群內部、不得商業使用', () => {
    const t = mount('terms').textContent!;
    expect(t).toContain('SQUARE ENIX CO., LTD.');
    expect(t).toContain('不得用於商業用途');
  });
  it('資料授權:CC BY-NC-SA 3.0、來源、不適用 MIT、ffxiv-datamining', () => {
    const t = mount('licenses').textContent!;
    for (const s of ['灰機 wiki', 'Eclair Falcie@Hades', 'CC BY-NC-SA 3.0', '不適用本專案的 MIT 授權', 'xivapi/ffxiv-datamining']) expect(t).toContain(s);
  });
  it('三頁互相有連結', () => {
    const links = Array.from(mount('terms').querySelectorAll('nav a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/licenses', '/privacy', '/terms']);
  });
});
