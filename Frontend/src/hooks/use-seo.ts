import { useEffect } from 'react';

/**
 * Custom hook for setting SEO tags (Title & Meta Description)
 */
export function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [title, description]);
}
