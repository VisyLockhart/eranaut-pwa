import type { EnvironmentProviders, Provider } from '@angular/core';

// 展示模式的掛載點(D-168)。正式版建置用這個空檔;`--configuration demo` 會把它換成 `demo-providers.demo.ts`,
// 所以正式版的 bundle 完全不含展示用的程式碼。
export const demoProviders: (Provider | EnvironmentProviders)[] = [];

/** 展示模式下「登入」按鈕要去的網址;正式版為 null,走 `/api/auth/login` */
export const DEMO_LOGIN_URL: string | null = null;
