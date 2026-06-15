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

export interface PublicPageConfig {
  name: string;
  logo: string;
  previewEnabled?: boolean;
  previewTitle?: string;
  previewDescription?: string;
  previewSiteName?: string;
  previewImage?: string;
}

export function applyPublicPageMeta(nameOrConfig: string | PublicPageConfig, logo?: string): () => void {
  const prevTitle = document.title;

  // Support both old (name, logo) and new (config object) signatures
  let cfg: PublicPageConfig;
  if (typeof nameOrConfig === 'string') {
    cfg = { name: nameOrConfig, logo: logo || '' };
  } else {
    cfg = nameOrConfig;
  }

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

  // Determine effective values: custom preview if enabled, else panel branding
  const useCustom = cfg.previewEnabled;
  const title = (useCustom && cfg.previewTitle) ? cfg.previewTitle : (cfg.name || 'FileUpShare');
  const description = (useCustom && cfg.previewDescription) ? cfg.previewDescription : SITE_DESCRIPTION;
  const siteName = (useCustom && cfg.previewSiteName) ? cfg.previewSiteName : title;
  const rawImage = (useCustom && cfg.previewImage) ? cfg.previewImage : (cfg.logo || '');
  // og:image must be an absolute URL — browsers and messengers both require it
  const image = rawImage && rawImage.startsWith('/')
    ? (window.location.origin + rawImage + (rawImage.includes('?') ? '&' : '?') + 'v=' + Date.now())
    : rawImage;

  // Browser tab title
  document.title = title;

  // Standard SEO
  set('meta[name="title"]', 'name', 'title', title);
  set('meta[name="description"]', 'name', 'description', description);

  // Open Graph
  set('meta[property="og:type"]', 'property', 'og:type', 'website');
  set('meta[property="og:title"]', 'property', 'og:title', title);
  set('meta[property="og:description"]', 'property', 'og:description', description);
  set('meta[property="og:site_name"]', 'property', 'og:site_name', siteName);

  // Twitter Card
  set('meta[name="twitter:card"]', 'name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  set('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  set('meta[name="twitter:description"]', 'name', 'twitter:description', description);

  if (image) {
    set('meta[property="og:image"]', 'property', 'og:image', image);
    set('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
    set('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
    set('meta[name="twitter:image"]', 'name', 'twitter:image', image);
  }

  // Cleanup function: restore title and remove dynamically added elements
  return () => {
    document.title = prevTitle;
    added.forEach(el => el.parentNode?.removeChild(el));
  };
}
