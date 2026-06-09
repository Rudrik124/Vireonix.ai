import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  width,
  height,
  className,
  ...props
}) => {
  // Helper to extract base name and extension if needed
  // This assumes the user provides the base path without extension for 'src'
  // and the browser will automatically pick .avif, .webp, or fallback.
  // Usage: <OptimizedImage src="/assets/hero" alt="Hero" fallbackSrc="/assets/hero.jpg" />
  
  return (
    <picture>
      <source srcSet={`${src}.avif`} type="image/avif" />
      <source srcSet={`${src}.webp`} type="image/webp" />
      <img
        src={fallbackSrc || `${src}.jpg`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={className}
        {...props}
      />
    </picture>
  );
};
