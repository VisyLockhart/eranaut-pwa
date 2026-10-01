// 開發用啟動器:一個指令同時跑 Angular dev server(內部 4201)與反向代理(對外 4200)。
// 為什麼不用 Vite 內建 proxy:Windows 上它對 /api 會間歇 ECONNRESET、甚至整條卡死(實測 100/100 逾時,
// 直連 API 200/200 正常)。這裡的行為仿照正式環境的 Caddy:/api/* → API,其餘 → 前端。
// 每個請求都開新連線(不重用 keep-alive),就是為了避開上述問題。
import http from 'node:http';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.WEB_PORT ?? 4200);
const NG_PORT = Number(process.env.NG_PORT ?? 4201);
const API = { host: '127.0.0.1', port: Number(process.env.API_PORT ?? 3000) };
const NG = { host: '127.0.0.1', port: NG_PORT };
const noKeepAlive = new http.Agent({ keepAlive: false });

function target(url) {
  return url === '/api' || url.startsWith('/api/') || url.startsWith('/api?') ? API : NG;
}

const server = http.createServer((req, res) => {
  const t = target(req.url ?? '/');
  const up = http.request(
    { ...t, method: req.method, path: req.url, headers: { ...req.headers, connection: 'close' }, agent: noKeepAlive },
    (r) => {
      res.writeHead(r.statusCode ?? 502, r.headers);
      r.pipe(res);
    },
  );
  up.setTimeout(30000, () => up.destroy(new Error('upstream timeout')));
  up.on('error', (e) => {
    console.error(`[dev-proxy] ${req.method} ${req.url} → ${t.port}: ${e.message}`);
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`dev-proxy: ${t.port === API.port ? 'API(3000) 連不上,請確認 API 有在跑' : '前端(4201) 還沒就緒,稍候重新整理'}`);
  });
  req.pipe(up);
});

// Angular dev server 的 HMR / live reload 走 WebSocket
server.on('upgrade', (req, socket, head) => {
  const up = http.request({ ...NG, method: req.method, path: req.url, headers: req.headers, agent: noKeepAlive });
  up.on('upgrade', (r, s, h) => {
    const lines = [`HTTP/1.1 ${r.statusCode} ${r.statusMessage}`];
    for (let i = 0; i < r.rawHeaders.length; i += 2) lines.push(`${r.rawHeaders[i]}: ${r.rawHeaders[i + 1]}`);
    socket.write(lines.join('\r\n') + '\r\n\r\n');
    if (h?.length) socket.write(h);
    s.pipe(socket);
    socket.pipe(s);
    s.on('error', () => socket.destroy());
    socket.on('error', () => s.destroy());
  });
  up.on('error', () => socket.destroy());
  up.end(head);
});

server.listen(PORT, '127.0.0.1', () => console.log(`[dev-proxy] http://localhost:${PORT}  (/api → :${API.port}, 其餘 → :${NG_PORT})`));

if (process.argv.includes('--proxy-only')) {
  // 測試用:只開代理,不啟動 ng serve
} else {
  const ng = spawn('npx', ['ng', 'serve', '--port', String(NG_PORT), '--host', '127.0.0.1', ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: true,
  });
  ng.on('exit', (code) => process.exit(code ?? 0));
  for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => ng.kill());
}
