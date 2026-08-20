self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
// A fetch handler (even a no-op one) is required for Chrome to treat this as
// an installable PWA that launches standalone instead of a regular browser
// tab - this intentionally does no caching so app/API behavior is untouched.
self.addEventListener("fetch", () => {});
