import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className, size = 56 }) => {
  const [logoSrc, setLogoSrc] = useState<string>("/assets/logo.png");

  useEffect(() => {
    const img = new Image();
    img.src = "/assets/logo.png";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Use higher resolution for the canvas
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Programmatically remove black background (threshold < 40)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is very dark (black), make it fully transparent
        if (r < 40 && g < 40 && b < 40) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setLogoSrc(canvas.toDataURL());
    };
  }, []);

  return (
    <img 
      src={logoSrc} 
      alt="Veytrix.Ai Logo"
      style={{ 
        width: size, 
        height: size,
        objectFit: 'contain'
      }}
      className={`${className} drop-shadow-[0_0_15px_rgba(168, 85, 247,0.4)]`}
    />
  );
};
