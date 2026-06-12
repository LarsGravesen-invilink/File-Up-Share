const SITE_DESCRIPTION = 'Персональная система обмена файлами FileUpShare';

function setOrCreate(selector: string, attr: string, attrVal: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applyPublicPageMeta(name: string, logo: string): () => void {
  const prevTitle = document.title;

  // Collect previously added meta elements for cleanup
  const added: HTMLMetaElement[] = [];

  function set(selector: string, attr: string, attrVal: string, content: string) {
    const existing = document.querySelector<HTMLMetaElement>(selector);
    if (!existing) {
      const el = document.createElement('meta');
      el.setAttribute(attr, attrVal);
      el.setAttribute('content', content);
      document.head.appendChild(el);
      added.push(el);
    } else {
      existing.setAttribute('content', content);
    }
  }

  const title = name || 'FileUpShare';

  // Browser tab title
  document.title = title;

  // Standard SEO
  set('meta[name="title"]', 'name', 'title', title);
  set('meta[name="description"]', 'name', 'description', SITE_DESCRIPTION);

  // Open Graph
  set('meta[property="og:type"]', 'property', 'og:type', 'website');
  set('meta[property="og:title"]', 'property', 'og:title', title);
  set('meta[property="og:description"]', 'property', 'og:description', SITE_DESCRIPTION);
  set('meta[property="og:site_name"]', 'property', 'og:site_name', title);

  // Twitter Card
  set('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary');
  set('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  set('meta[name="twitter:description"]', 'name', 'twitter:description', SITE_DESCRIPTION);

  if (logo) {
    set('meta[property="og:image"]', 'property', 'og:image', logo);
    set('meta[property="og:image:width"]', 'property', 'og:image:width', '200');
    set('meta[property="og:image:height"]', 'property', 'og:image:height', '200');
    set('meta[name="twitter:image"]', 'name', 'twitter:image', logo);
  }

  // Cleanup function: restore title and remove dynamically added elements
  return () => {
    document.title = prevTitle;
    added.forEach(el => el.parentNode?.removeChild(el));
  };
}
