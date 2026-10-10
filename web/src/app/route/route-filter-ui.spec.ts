import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteFilterDto } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SEA_INDEXES } from './core/data';
import { RouteFilterVm } from './route-filter-vm';
import { RouteFindVm } from './route-find-vm';
import { RoutePage } from './route-page';
import { RouteVm } from './route-vm';

const grey = () => SEA_INDEXES[1]!;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const row = (over: Partial<RouteFilterDto> = {}): RouteFilterDto => ({
  id: 'a', name: '灰海組', spec: { v: 1, sea: 'all', max_hours: 6, sort: 'perMin', required: [grey().sea.points[0]!.id], excluded: [], item_ids: [], match: 'all' },
  favorite: false, created_at: '', updated_at: '', ...over,
});

describe('條件組合的畫面(D-229)', () => {
  let el: HTMLElement;
  let f: ReturnType<typeof TestBed.createComponent<RoutePage>>;
  let http: HttpTestingController;
  let fv: RouteFilterVm;
  let find: RouteFindVm;

  async function mount(list: RouteFilterDto[], desktop = false) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(desktop);
    const vm = TestBed.inject(RouteVm);
    find = TestBed.inject(RouteFindVm);
    fv = TestBed.inject(RouteFilterVm);
    http = TestBed.inject(HttpTestingController);
    vm.setTab('route');
    vm.findOpen.set(true);
    f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    http.expectOne('/api/route-subs').flush([]);
    http.expectOne('/api/route-filters').flush(list);
    await tick();
    f.detectChanges();
    el = f.nativeElement as HTMLElement;
  }
  const btn = (text: string, root: ParentNode = el) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim().startsWith(text))!;
  const dlg = () => document.querySelector('app-route-filter-dialogs [role=dialog]') as HTMLElement | null;
  const dlgBtn = (text: string) => btn(text, dlg()!.querySelector('.rt-dlg-foot')!);
  const pickOption = (label: string) => {
    (el.querySelector('app-route-filter-bar .sel-trigger, app-route-filter-bar button[aria-haspopup]') as HTMLButtonElement).click();
    f.detectChanges();
    const li = [...el.querySelectorAll<HTMLElement>('app-route-filter-bar .sel-opt')].find((o) => o.textContent!.trim().startsWith(label))!;
    li.click();
    f.detectChanges();
  };

  beforeEach(() => localStorage.clear());

  it('沒有條件時「儲存」不能按;有條件才能存,預設名稱依條件', async () => {
    await mount([]);
    expect(btn('儲存', el.querySelector('app-route-filter-bar')!).disabled).toBe(true);
    find.maxHours.set(6);
    find.cycleFilter(grey().sea.points[0]!.id);
    f.detectChanges();
    btn('儲存', el.querySelector('app-route-filter-bar')!).click();
    f.detectChanges();
    expect(dlg()).not.toBeNull();
    const input = dlg()!.querySelector<HTMLInputElement>('input[type=text]')!;
    await tick();
    f.detectChanges();
    expect(input.value).toBe('6 小時內 · 1 點');
    dlgBtn('儲存').click();
    const req = http.expectOne('/api/route-filters');
    expect(req.request.body.name).toBe('6 小時內 · 1 點');
    req.flush(row({ id: 'n', name: '6 小時內 · 1 點' }), { status: 201, statusText: 'Created' });
    await tick();
    f.detectChanges();
    expect(dlg()).toBeNull();
    expect(fv.saved()).toHaveLength(1);
  });

  it('目前沒有條件時選一組直接載入;有條件時先確認,取消則不變', async () => {
    await mount([row()]);
    pickOption('灰海組');
    expect(dlg()).toBeNull();
    expect(find.maxHours()).toBe(6);
    expect(find.required().size).toBe(1);
    // 載入後自動搜尋,並收合海圖與條件區(D-230)
    await tick();
    f.detectChanges();
    expect(find.result()).not.toBeNull();
    expect(find.x.mapOpen()).toBe(false);
    expect(find.condOpen()).toBe(false);
    expect(el.querySelector('#rt-find-cond-body')).toBeNull();
    btn('展開', el.querySelector('.rt-find-cond')!).click();
    f.detectChanges();
    expect(el.querySelector('#rt-find-cond-body')).not.toBeNull();
    // 另一個狀態:改過條件後再選別組
    fv.activeId.set(null);
    find.maxHours.set(24);
    pickOption('灰海組');
    expect(dlg()).not.toBeNull();
    expect(dlg()!.textContent).toContain('要換掉目前的條件嗎?');
    dlgBtn('取消').click();
    f.detectChanges();
    expect(find.maxHours()).toBe(24);
    pickOption('灰海組');
    dlgBtn('換掉並載入').click();
    f.detectChanges();
    expect(find.maxHours()).toBe(6);
    await tick();
    expect(find.result()).not.toBeNull();
  });

  it('改過載入的組合後存:可選「更新」或「另存新組」;更新送 PUT', async () => {
    await mount([row()]);
    fv.apply(fv.saved()[0]!);
    find.maxHours.set(12);
    f.detectChanges();
    btn('儲存', el.querySelector('app-route-filter-bar')!).click();
    f.detectChanges();
    expect(dlg()!.textContent).toContain('更新「灰海組」');
    dlgBtn('更新').click();
    const req = http.expectOne('/api/route-filters/a');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.spec.max_hours).toBe(12);
    req.flush(row({ spec: { ...row().spec, max_hours: 12 } }));
    await tick();
    f.detectChanges();
    expect(dlg()).toBeNull();
    expect(fv.modified()).toBe(false);
  });

  it('已滿 30 組:另存新組要選一組覆蓋', async () => {
    await mount(Array.from({ length: 30 }, (_, i) => row({ id: `r${i}`, name: `組${i}` })));
    find.maxHours.set(48);
    f.detectChanges();
    btn('儲存', el.querySelector('app-route-filter-bar')!).click();
    f.detectChanges();
    expect(dlg()!.textContent).toContain('已滿 30 組');
    expect(dlgBtn('覆蓋').disabled).toBe(true);
    dlg()!.querySelectorAll<HTMLButtonElement>('.rt-pick')[3]!.click();
    f.detectChanges();
    dlgBtn('覆蓋').click();
    const req = http.expectOne('/api/route-filters/r3');
    expect(req.request.method).toBe('PUT');
    req.flush(row({ id: 'r3', name: '組3' }));
    await tick();
    expect(dlg()).toBeNull();
  });

  it('下拉:有常用時分成「★ 常用」「全部條件組合」兩組,常用排前面', async () => {
    await mount([row({ id: 'a', name: '甲' }), row({ id: 'b', name: '乙', favorite: true })]);
    btn('選擇條件組合', el.querySelector('app-route-filter-bar')!).click();
    f.detectChanges();
    const items = [...document.querySelectorAll('.sel-panel > li')].map((li) => `${li.className.includes('sel-group') ? '#' : ''}${li.textContent?.trim()}`);
    expect(items).toEqual(['選擇條件組合…', '#★ 常用', '乙', '#全部條件組合', '甲']);
  });

  it('下拉:沒有任何常用時維持單層清單(沒有群組標題)', async () => {
    await mount([row({ id: 'a', name: '甲' })]);
    btn('選擇條件組合', el.querySelector('app-route-filter-bar')!).click();
    f.detectChanges();
    expect(document.querySelector('.sel-group')).toBeNull();
  });

  it('管理:星號切換送 PATCH;超過 8 組有搜尋與「★ 常用」', async () => {
    await mount(Array.from({ length: 12 }, (_, i) => row({ id: `r${i}`, name: `組${String(i).padStart(2, '0')}`, favorite: i === 4 })));
    btn('管理', el.querySelector('app-route-filter-bar')!).click();
    f.detectChanges();
    const rows = () => [...dlg()!.querySelectorAll('.rt-fm-row .rt-fm-main b')].map((b) => b.textContent);
    expect(rows()).toHaveLength(12); // 對話框內不分頁
    expect(rows()[0]).toBe('組04'); // 常用在前
    const q = dlg()!.querySelector<HTMLInputElement>('.rt-lt-q')!;
    q.value = '組1';
    q.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(rows()).toEqual(['組10', '組11']);
    q.value = '';
    q.dispatchEvent(new Event('input'));
    btn('★ 常用', dlg()!).click();
    f.detectChanges();
    expect(rows()).toEqual(['組04']);
    btn('★ 常用', dlg()!).click();
    f.detectChanges();
    dlg()!.querySelectorAll<HTMLButtonElement>('.rt-fm-row .rt-star')[1]!.click(); // 組00
    await tick();
    const req = http.expectOne((r) => r.url === '/api/route-filters/r0' && r.method === 'PATCH');
    expect(req.request.body).toEqual({ favorite: true });
    req.flush(row({ id: 'r0', favorite: true }));
  });

  it('管理:改名與刪除(刪除按兩下)', async () => {
    await mount([row()]);
    btn('管理', el.querySelector('app-route-filter-bar')!).click();
    f.detectChanges();
    btn('改名', dlg()!).click();
    f.detectChanges();
    const input = dlg()!.querySelector<HTMLInputElement>('input[type=text]')!;
    input.value = '新名字';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    btn('確定', dlg()!).click();
    const req = http.expectOne('/api/route-filters/a');
    expect(req.request.body.name).toBe('新名字');
    req.flush(row({ name: '新名字' }));
    await tick();
    f.detectChanges();
    expect(dlg()!.textContent).toContain('新名字');
    btn('刪除', dlg()!).click();
    f.detectChanges();
    http.expectNone('/api/route-filters/a');
    btn('確定刪除?', dlg()!).click();
    http.expectOne('/api/route-filters/a').flush(null, { status: 204, statusText: 'No Content' });
    await tick();
    f.detectChanges();
    expect(fv.saved()).toEqual([]);
  });
});
