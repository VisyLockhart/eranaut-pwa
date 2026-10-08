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
