self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
// A fetch handler (even a no-op one) is required for Chrome to treat this as
// an installable PWA that launches standalone instead of a regular browser
// tab - this intentionally does no caching so app/API behavior is untouched.
self.addEventListener("fetch", () => {});

// Push payload is always JSON: { title, body, url } - see
// app/api/proposal/signed-notification/route.ts, the only sender today.
self.addEventListener("push", (event) => {
  let data = { title: "Utah Awnings", body: "" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // Non-JSON payload (shouldn't happen from our own sender) - fall back
    // to the default above rather than throwing and dropping the notification.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

// Focuses an already-open tab on that URL if one exists, otherwise opens a
// new one - avoids piling up duplicate tabs when a rep taps several
// notifications in a row.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
