// 霸總教你背單字：通知用的背景程式。
// 只負責「收到推播 → 顯示通知」與「點通知 → 打開 App」。
// 刻意不處理任何網頁請求、不做快取，所以不會讓 App 卡在舊版。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { b: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.t || '霸總教你背單字', {
    body: d.b || '女人，今天的單字還沒背。',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || 'bz',
    data: { u: d.u || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.u) || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope) && 'focus' in w) return w.focus();
    }
    return self.clients.openWindow(url);
  })());
});
