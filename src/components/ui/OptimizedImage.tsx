// src/components/ui/OptimizedImage.tsx
'use client'; // 声明为客户端组件
import type { ImageProps as NextImageProps } from 'next/image';
import NextImage from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<NextImageProps, 'src' | 'alt' | 'className'> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  width?: number | `${number}`;
  height?: number | `${number}`;
  quality?: number | `${number}`;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, 80vw',
  fill = false,
  width,
  height,
  quality = 80,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Handle image loading errors
  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  // Handle image load complete
  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className={`relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${containerClassName}`}>
        <div className="text-gray-500 dark:text-gray-400 p-4 text-center">
          Failed to load image
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${containerClassName}`} style={style}>
      <NextImage
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={`transition-opacity duration-300 object-cover ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        sizes={sizes}
        priority={priority}
        quality={Number(quality)}
        onLoadingComplete={handleLoadComplete}
        onError={handleError}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
