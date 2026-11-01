import { describe, expect, it } from 'vitest';
import { pageOfPath } from './shell';

describe('pageOfPath(D-319 每頁主題筆色)', () => {
  it('配件群組、更新群組、航線、設定各自一組,其餘為 home', () => {
    expect(pageOfPath('/gear')).toBe('gear');
    expect(pageOfPath('/craft')).toBe('gear');
    expect(pageOfPath('/update')).toBe('update');
    expect(pageOfPath('/charts')).toBe('update');
    expect(pageOfPath('/route')).toBe('route');
    expect(pageOfPath('/settings')).toBe('settings');
    expect(pageOfPath('/')).toBe('home');
    expect(pageOfPath('/privacy')).toBe('home');
  });
});
