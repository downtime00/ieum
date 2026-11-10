// Web Push 이벤트 핸들러 (서비스 워커)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || '이음';
  event.waitUntil(
    (async () => {
      // 진동 설정 확인 (쿠키 ieum_vibration=0 이면 끔, 기본 켬)
      let vibrate = [200, 100, 200];
      try {
        if (self.cookieStore) {
          const cookie = await self.cookieStore.get('ieum_vibration');
          if (cookie && cookie.value === '0') vibrate = undefined;
        }
      } catch (e) {}

      return self.registration.showNotification(title, {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: data.tag || 'ieum-notification',
        renotify: true,
        vibrate,
        data: { url: data.url || '/' },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
