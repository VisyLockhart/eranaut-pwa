import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { CrystalElement, CrystalTier } from './core/craft-tree';

interface Palette {
  base: string;
  light: string;
  dark: string;
}

/** 各元素的顏色(取自遊戲內圖示的色相):淺面、主色、暗面 */
export const CRYSTAL_PALETTE: Readonly<Record<CrystalElement, Palette>> = {
  風: { base: '#3fcf6f', light: '#a4f2bd', dark: '#1b8a47' },
  冰: { base: '#4fd6ee', light: '#b4f2fc', dark: '#1d8fae' },
  火: { base: '#ee7b2e', light: '#fab98a', dark: '#a4451a' },
  水: { base: '#3f86f0', light: '#a3c8fb', dark: '#1d52b0' },
  土: { base: '#f2ab28', light: '#fad98a', dark: '#a76c0c' },
  雷: { base: '#b457ea', light: '#dda6f8', dark: '#782eac' },
};

/**
 * 晶類小圖示(自繪,非遊戲素材):形狀表示種類(碎晶 = 小寶石、水晶 = 長六角晶體、晶簇 = 一叢三根),
 * 顏色表示元素(顏色之外一律另有文字,不靠顏色分辨)。
 */
@Component({
  selector: 'app-crystal-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.width.px]': 'size()', '[style.height.px]': 'size()', style: 'display:inline-flex;flex:0 0 auto', 'aria-hidden': 'true' },
  template: `
    <svg width="100%" height="100%" viewBox="0 0 24 24" stroke-linejoin="round" stroke="rgba(2,6,14,0.55)" stroke-width="0.9">
      @switch (tier()) {
        @case ('碎晶') {
          <polygon points="12,4 18,9 15.5,19.5 8.5,20 6,10" [attr.fill]="p().base" />
          <polygon points="12,4 6,10 11.5,12.5" [attr.fill]="p().light" stroke="none" />
          <polygon points="18,9 15.5,19.5 11.5,12.5" [attr.fill]="p().dark" stroke="none" />
          <polygon points="15.5,19.5 8.5,20 11.5,12.5" [attr.fill]="p().dark" fill-opacity="0.75" stroke="none" />
          <polygon points="12,4 18,9 15.5,19.5 8.5,20 6,10" fill="none" />
        }
        @case ('水晶') {
          <polygon points="12,1.5 17.5,6.5 17.5,17.5 12,22.5 6.5,17.5 6.5,6.5" [attr.fill]="p().base" />
          <polygon points="12,1.5 6.5,6.5 6.5,17.5 12,22.5" [attr.fill]="p().light" stroke="none" />
          <polygon points="12,1.5 14.6,6.5 14.6,17.5 12,22.5" [attr.fill]="p().base" stroke="none" />
          <polygon points="12,1.5 17.5,6.5 17.5,17.5 12,22.5 14.6,17.5 14.6,6.5" [attr.fill]="p().dark" stroke="none" />
          <polygon points="8.6,7 10.2,5.8 10.2,13 8.6,15" fill="#fff" fill-opacity="0.55" stroke="none" />
          <polygon points="12,1.5 17.5,6.5 17.5,17.5 12,22.5 6.5,17.5 6.5,6.5" fill="none" />
        }
        @default {
          <polygon points="5.2,8.5 8.4,12 8,21 2.4,21 2.4,12" [attr.fill]="p().dark" />
          <polygon points="18.8,10 21.8,13 21.8,21 15.6,21 15.6,13" [attr.fill]="p().dark" />
          <polygon points="12,2 15.6,7 15.2,21 8.8,21 8.4,7" [attr.fill]="p().base" />
          <polygon points="12,2 8.4,7 8.8,21 12,21" [attr.fill]="p().light" stroke="none" />
          <polygon points="12,2 15.6,7 15.2,21 12,21" [attr.fill]="p().dark" fill-opacity="0.6" stroke="none" />
          <polygon points="5.2,8.5 2.4,12 2.4,21 5.2,21" [attr.fill]="p().light" stroke="none" />
          <polygon points="12,2 15.6,7 15.2,21 8.8,21 8.4,7" fill="none" />
        }
      }
    </svg>
  `,
})
export class CrystalIcon {
  readonly element = input.required<CrystalElement>();
  readonly tier = input.required<CrystalTier>();
  readonly size = input(20);
  protected readonly p = computed(() => CRYSTAL_PALETTE[this.element()]);
}
