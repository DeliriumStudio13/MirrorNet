'use client';

import Image from 'next/image';
import { User2 } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export function Avatar({ src, alt, size = 40, className = '', showBorder = true }: AvatarProps) {
  const borderClass = showBorder ? 'border-2 border-gray-700' : '';
  
  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center ${borderClass} ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
          <User2 
            className="text-gray-400"
            style={{ 
              width: Math.max(size * 0.5, 12),
              height: Math.max(size * 0.5, 12)
            }}
          />
        </div>
      )}
    </div>
  );
}
