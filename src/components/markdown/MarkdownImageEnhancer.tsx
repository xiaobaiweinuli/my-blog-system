'use client';

import { useEffect } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { renderToString } from 'react-dom/server';

export function MarkdownImageEnhancer() {
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') return;

    // Find all optimized image placeholders
    const imageContainers = document.querySelectorAll<HTMLDivElement>(
      'div[data-optimized-image="true"]'
    );

    imageContainers.forEach((container) => {
      const src = container.getAttribute('data-src');
      const alt = container.getAttribute('data-alt') || '';
      
      if (!src) return;

      try {
        // Create a new div to hold the optimized image
        const wrapper = document.createElement('div');
        wrapper.className = container.className;
        
        // Render the OptimizedImage component to a string
        const optimizedImageString = renderToString(
          <OptimizedImage
            src={src}
            alt={alt}
            width={1200}
            height={675}
            sizes="(max-width: 768px) 100vw, 80vw"
            className="object-cover w-full h-full"
            containerClassName="w-full h-full"
          />
        );
        
        // Set the innerHTML of the wrapper
        wrapper.innerHTML = optimizedImageString;
        
        // Replace the placeholder with the optimized image
        if (container.parentNode) {
          container.parentNode.replaceChild(wrapper, container);
        }
      } catch (error) {
        console.error('Error enhancing markdown image:', error);
        // Fallback to original image if there's an error
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.className = 'w-full h-auto';
        container.parentNode?.replaceChild(img, container);
      }
    });
  }, []);

  return null;
}
