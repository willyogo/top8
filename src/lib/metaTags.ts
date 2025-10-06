export function updateMetaTags(params: {
  title: string;
  description: string;
  image: string;
  url: string;
}) {
  // Update title
  document.title = params.title;

  // Update or create meta tags
  const metaTags = [
    { property: 'og:title', content: params.title },
    { property: 'og:description', content: params.description },
    { property: 'og:image', content: params.image },
    { property: 'og:url', content: params.url },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: params.title },
    { name: 'twitter:description', content: params.description },
    { name: 'twitter:image', content: params.image },
    { property: 'fc:frame', content: 'vNext' },
    { property: 'fc:frame:image', content: params.image },
  ];

  metaTags.forEach(({ property, name, content }) => {
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
    let element = document.querySelector(selector) as HTMLMetaElement;

    if (!element) {
      element = document.createElement('meta');
      if (property) {
        element.setAttribute('property', property);
      } else if (name) {
        element.setAttribute('name', name);
      }
      document.head.appendChild(element);
    }

    element.setAttribute('content', content);
  });
}

export function getOGImageUrl(username: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/og-image?username=${encodeURIComponent(username)}`;
}
