import { describe, expect, it } from 'vitest';
import { SEAS } from './core/data';
import { DOT_R, HIT_R } from './route-map';

describe('航點地圖的圈圈與觸控範圍(D-211)', () => {
  it('每個海域裡,任兩個航點(含出發點)的圈圈不重疊、觸控範圍不重疊', () => {
    for (const sea of SEAS) {
      const pts = [...sea.points.map((p) => ({ code: p.code, x: p.x, y: p.y })), { code: '出發', x: sea.home.x, y: sea.home.y }];
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y);
          const where = `${sea.name} ${pts[i]!.code}-${pts[j]!.code}`;
          expect(d, `${where} 圈圈重疊`).toBeGreaterThan(2 * DOT_R);
          expect(d, `${where} 觸控範圍重疊`).toBeGreaterThanOrEqual(2 * HIT_R);
        }
      }
    }
  });

  it('觸控範圍比圈圈大,圈圈比舊版(半徑 20)大', () => {
    expect(HIT_R).toBeGreaterThan(DOT_R);
    expect(DOT_R).toBeGreaterThan(20);
    expect(HIT_R).toBeGreaterThan(34);
  });
});

describe('海圖探索模式與隱藏未發現的點(D-293)', () => {
  const render = async (inputs: Record<string, unknown>) => {
    const { TestBed } = await import('@angular/core/testing');
    const { RouteMap } = await import('./route-map');
    const { SEA_INDEXES } = await import('./core/data');
    TestBed.resetTestingModule();
    const f = TestBed.createComponent(RouteMap);
    f.componentRef.setInput('sea', SEA_INDEXES[0]!);
    for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
    f.detectChanges();
    return f.nativeElement as HTMLElement;
  };
  const byCode = (el: HTMLElement, code: string) => [...el.querySelectorAll('g.rt-pt')].find((g) => g.querySelector('.code')?.textContent?.trim() === code);

  it('已發現實心、未發現虛線(點一下加入)、新增與取消有徽章', async () => {
    const el = await render({ found: new Set([1, 2, 3]), added: new Set([3]), removed: new Set([4]) });
    expect(byCode(el, 'A')!.classList).toContain('cf-on');
    expect(byCode(el, 'C')!.classList).toContain('cf-add');
    expect(byCode(el, 'D')!.classList).toContain('cf-rem');
    expect(byCode(el, 'E')!.classList).toContain('cf-off');
    expect(byCode(el, 'E')!.getAttribute('aria-label')).toContain('未發現');
  });

  it('hidden 的點不畫,連到它的線也不畫;已選進路線的點照畫', async () => {
    const all = await render({});
    const hidden = new Set(SEAS[0]!.points.filter((p) => p.code !== 'A' && p.code !== 'B').map((p) => p.id));
    const el = await render({ hidden, seq: [5] });
    expect(el.querySelectorAll('g.rt-pt').length).toBe(3); // A、B + 已選的 E
    expect(el.querySelectorAll('line.rt-link').length).toBeLessThan(all.querySelectorAll('line.rt-link').length);
  });
});
