import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function PremiumBadge({ size = 'sm', showText = false, className = '' }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (showText) {
    return (
      <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full ${textSizes[size]} font-medium ${className}`}>
        <Crown className={iconSizes[size]} />
        Premium
      </span>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center ${className}`} title="Premium User">
      <Crown className={`${iconSizes[size]} text-white`} />
    </div>
  );
}
