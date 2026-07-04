/*!
 * coi-serviceworker - enables SharedArrayBuffer on static hosts (e.g. GitHub
 * Pages) that can't set Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy
 * response headers directly. It intercepts fetches via a service worker and
 * injects those headers, then reloads once so the page becomes
 * cross-origin-isolated. Needed by ffmpeg.wasm (and anything else using
 * SharedArrayBuffer / WASM threads) on plain static hosting.
 *
 * Drop this file next to any HTML page that needs it and add:
 *   <script src="coi-serviceworker.js"></script>
 * as the FIRST script in <head>, before any other script that touches
 * SharedArrayBuffer.
 *
 * Public-domain style utility, widely used by ffmpeg.wasm / pyodide / webR
 * projects for exactly this static-hosting workaround.
 */
let coepCredentialless = false;

if (typeof window === 'undefined') {
  // Running as the service worker itself.
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('message', (ev) => {
    if (!ev.data) return;
    if (ev.data.type === 'deregister') {
      self.registration.unregister().then(() => self.clients.matchAll())
        .then((clients) => clients.forEach((client) => client.navigate(client.url)));
    } else if (ev.data.type === 'coepCredentialless') {
      coepCredentialless = ev.data.value;
    }
  });

  self.addEventListener('fetch', (event) => {
    const r = event.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;

    const request = (coepCredentialless && r.mode === 'no-cors')
      ? new Request(r, { credentials: 'omit' })
      : r;

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 0) return response;

          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cross-Origin-Embedder-Policy', coepCredentialless ? 'credentialless' : 'require-corp');
          if (!coepCredentialless) newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
          newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        })
        .catch((e) => console.error(e))
    );
  });

} else {
  // Running as a normal page script: register the service worker above (this
  // same file, loaded in the SW context) and reload once it's controlling
  // the page, so window.crossOriginIsolated flips to true.
  (() => {
    const coi = {
      shouldRegister: () => true,
      shouldDeregister: () => false,
      coepCredentialless: () => true,
      doReload: () => window.location.reload(),
      quiet: false,
      ...window.coi,
    };

    const n = navigator;

    if (n.serviceWorker && n.serviceWorker.controller) {
      n.serviceWorker.controller.postMessage({ type: 'coepCredentialless', value: coi.coepCredentialless() });
      if (coi.shouldDeregister()) n.serviceWorker.controller.postMessage({ type: 'deregister' });
    }

    // Already isolated (or browser has no notion of it) -> nothing to do.
    if (window.crossOriginIsolated !== false || !n.serviceWorker) return;
    if (!coi.shouldRegister()) return;

    n.serviceWorker.register(window.document.currentScript.src).then(
      (registration) => {
        !coi.quiet && console.log('COOP/COEP Service Worker registered', registration.scope);
        registration.addEventListener('updatefound', () => {
          !coi.quiet && console.log('Reloading page to use updated COOP/COEP Service Worker.');
          coi.doReload();
        });
        if (registration.active && !n.serviceWorker.controller) {
          !coi.quiet && console.log('Reloading page to use COOP/COEP Service Worker.');
          coi.doReload();
        }
      },
      (err) => { !coi.quiet && console.error('COOP/COEP Service Worker failed to register:', err); }
    );
  })();
}
