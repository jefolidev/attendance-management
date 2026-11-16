self.addEventListener('push', (event) => {
  let message = { title: 'Ponto Digital', body: 'Você tem um novo aviso de ponto.' }
  try {
    if (event.data) message = { ...message, ...event.data.json() }
  } catch {
    if (event.data) message.body = event.data.text()
  }

  event.waitUntil(self.registration.showNotification(message.title, {
    body: message.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: message.tag,
    data: { url: '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const appWindow = clients.find((client) => 'focus' in client)
    if (appWindow) return appWindow.focus()
    return self.clients.openWindow(event.notification.data?.url || '/')
  }))
})
