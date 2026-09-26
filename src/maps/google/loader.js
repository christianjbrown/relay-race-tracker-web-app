const CALLBACK = '__relayTrackerMapsReady';
const GIVE_UP_MS = 45000;
const CHECK_MS = 100;

/**
 * Loads the Maps library and resolves with `google.maps` once it really
 * exists. The callback has been seen to fire a moment before it does, and
 * a page that reads it then stops dead.
 */
export function loadGoogleMaps(win, { key, language, region }) {
  const ready = () => Boolean(win.google?.maps?.Map);
  return new Promise((resolve, reject) => {
    win[CALLBACK] = () => {
      const started = win.Date.now();
      const check = () => {
        if (ready()) resolve(win.google.maps);
        else if (win.Date.now() - started > GIVE_UP_MS) reject(new Error('Google Maps did not finish loading'));
        else win.setTimeout(check, CHECK_MS);
      };
      check();
    };
    const params = new URLSearchParams({ key, language, region, loading: 'async', callback: CALLBACK });
    const script = win.document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => reject(new Error('Google Maps script failed to load'));
    win.document.head.appendChild(script);
  });
}
