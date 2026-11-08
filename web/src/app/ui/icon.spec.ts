import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ThemeService } from '../core/theme';
import { IconComponent } from './icon';

@Component({ imports: [IconComponent], template: `<app-icon name="home" /><app-icon name="discord" /><app-icon name="logo" [size]="34" />` })
class Host {}

@Component({ imports: [IconComponent], template: `<app-icon name="collapseAll" /><app-icon name="expandAll" /><app-icon name="stockBox" />` })
class IconsHost {}

describe('IconComponent 依主題換圖示', () => {
  const render = async (theme: 'classic' | 'light' | 'dark' | 'notebook') => {
    TestBed.inject(ThemeService).set(theme);
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    return [...f.nativeElement.querySelectorAll('app-icon')].map((e) => (e as HTMLElement).innerHTML);
  };

  it('經典用線條圖示,淺色改用像素圖示', async () => {
    const [classicHome] = await render('classic');
    expect(classicHome).toContain('stroke="currentColor"');
    const [lightHome] = await render('light');
    expect(lightHome).toContain('shape-rendering="crispEdges"');
    expect(lightHome).not.toContain('stroke="currentColor"');
  });

  it('品牌 logo(D-280):每個主題各載入自己的全彩圖檔', async () => {
    for (const t of ['classic', 'light', 'dark', 'notebook'] as const) {
      const [, , logo] = await render(t);
      expect(logo).toContain(`icons/logo-${t}.svg`);
    }
  });

  it('工具列與庫存組的新圖示(D-328)淺色有像素版、手札有手繪版,經典 / 深色沿用線條', async () => {
    const names = ['collapseAll', 'expandAll', 'stockBox'] as const;
    const draw = async (theme: 'classic' | 'light' | 'dark' | 'notebook') => {
      TestBed.inject(ThemeService).set(theme);
      const f = TestBed.createComponent(IconsHost);
      await f.whenStable();
      return [...f.nativeElement.querySelectorAll('app-icon')].map((e) => (e as HTMLElement).innerHTML);
    };
    const classic = await draw('classic');
    expect(await draw('dark')).toEqual(classic);
    const light = await draw('light');
    const notebook = await draw('notebook');
    names.forEach((_, i) => {
      expect(light[i]).toContain('shape-rendering="crispEdges"');
      expect(light[i]).not.toBe(classic[i]);
      expect(notebook[i]).toContain('stroke-width="1.9"');
      expect(notebook[i]).not.toBe(classic[i]);
    });
    expect(new Set(light).size).toBe(3);
    expect(new Set(notebook).size).toBe(3);
  });

  it('沒有像素版的圖示(discord)在淺色仍沿用原圖示', async () => {
    const [, classicDiscord] = await render('classic');
    const [, lightDiscord] = await render('light');
    expect(lightDiscord).toBe(classicDiscord);
  });
});
