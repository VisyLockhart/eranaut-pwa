import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CRYSTAL_ELEMENTS, type CrystalTier } from './core/craft-tree';
import { CrystalIcon } from './crystal-icon';

describe('CrystalIcon(D-264)', () => {
  for (const tier of ['碎晶', '水晶', '晶簇'] as CrystalTier[]) {
    it(`${tier}:六種元素都畫得出來`, () => {
      for (const element of CRYSTAL_ELEMENTS) {
        const f = TestBed.createComponent(CrystalIcon);
        f.componentRef.setInput('element', element);
        f.componentRef.setInput('tier', tier);
        f.detectChanges();
        expect((f.nativeElement as HTMLElement).querySelectorAll('svg path, svg polygon').length, `${element}${tier}`).toBeGreaterThan(0);
      }
    });
  }
});
