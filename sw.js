// 霸總教你背單字：通知用的背景程式。
// 只負責「收到推播 → 顯示通知」與「點通知 → 打開 App」。
// 離線閱讀：只有使用者按過「下載供離線閱讀」才會有離線資料。
// 網頁一律先連網路（拿到最新版），連不上才用下載的檔案，所以不會卡在舊版；帶 ?v= 的資料檔內容固定，下載過就直接用。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { b: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.t || '霸總教你背單字', {
    body: d.b || '女人，今天的單字還沒背。',
    icon: 'icon-192.png',
    badge: 'badge-96.png',
    tag: d.tag || 'bz',
    data: { u: d.u || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const u = new URL((e.notification.data && e.notification.data.u) || './', self.registration.scope);
  e.waitUntil((async () => {
    // 有安裝 Android App 的手機：通知會由 App 打開，帶上 app=android 讓網頁進入 App 模式
    try { if (await caches.match('/__app')) u.searchParams.set('app', 'android'); } catch (_) {}
    const url = u.href;
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope) && 'focus' in w) return w.focus();
    }
    return self.clients.openWindow(url);
  })());
});

const OFF = 'bz-offline';
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') {
    if (!/^\/(index\.html)?$/.test(u.pathname)) return;
    e.respondWith(fetch(r).catch(async () => {
      const c = await caches.open(OFF);
      return (await c.match(new URL('./', self.registration.scope).href)) || Response.error();
    }));
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(OFF);
    const hit = await c.match(r);
    if (hit && u.searchParams.has('v')) return hit;
    try { return await fetch(r); } catch (err) { if (hit) return hit; throw err; }
  })());
});
