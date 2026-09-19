import { useEffect } from 'react';

// Loads the Monetag tag once, on public pages only (never in /admin, because
// PublicLayout is not used by the admin routes).
const MONETAG_SRC = 'https://quge5.com/88/tag.min.js';
const MONETAG_ZONE = '283313';

export default function AdTag() {
  useEffect(() => {
    if (document.querySelector(`script[data-zone="${MONETAG_ZONE}"]`)) return;
    const s = document.createElement('script');
    s.src = MONETAG_SRC;
    s.async = true;
    s.setAttribute('data-zone', MONETAG_ZONE);
    s.setAttribute('data-cfasync', 'false');
    document.head.appendChild(s);
  }, []);
  return null;
}
