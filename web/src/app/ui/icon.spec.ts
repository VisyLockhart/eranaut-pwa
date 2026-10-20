import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ThemeService } from '../core/theme';
import { IconComponent } from './icon';

@Component({ imports: [IconComponent], template: `<app-icon name="home" /><app-icon name="discord" /><app-icon name="logo" [size]="34" />` })
class Host {}

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

  it('沒有像素版的圖示(discord)在淺色仍沿用原圖示', async () => {
    const [, classicDiscord] = await render('classic');
    const [, lightDiscord] = await render('light');
    expect(lightDiscord).toBe(classicDiscord);
  });
});
