// Minimal service worker. Its only jobs are (1) to make the app installable
// to the home screen (browsers require a registered SW with a fetch handler)
// and (2) to show a friendly screen when the device is offline.
//
// It intentionally does NOT cache pages or assets, so a new deploy is never
// served stale — every request goes to the network.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Only intercept full-page navigations so we can fall back to an offline
  // message. Everything else hits the network normally.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            "<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
              "<body style='margin:0;display:grid;place-items:center;height:100vh;background:#0a0a0f;color:#f5f5f7;font-family:system-ui,sans-serif;text-align:center'>" +
              "<div><h1 style='font-size:20px'>You're offline</h1><p style='color:#b8b6c4'>Reconnect to use MySpace Reborn.</p></div>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
          ),
      ),
    );
  }
});
