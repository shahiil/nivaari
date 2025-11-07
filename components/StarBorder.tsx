import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = 'cyan',
  speed = '6s',
  thickness = 2,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  // Color mapping for Tailwind-friendly gradients
  const colorMap: Record<string, string> = {
    cyan: 'rgba(0, 183, 255, 0.8)',
    blue: 'rgba(59, 130, 246, 0.8)',
    purple: 'rgba(168, 85, 247, 0.8)',
    pink: 'rgba(236, 72, 153, 0.8)',
    green: 'rgba(34, 197, 94, 0.8)',
    yellow: 'rgba(234, 179, 8, 0.8)',
    red: 'rgba(239, 68, 68, 0.8)',
    white: 'rgba(255, 255, 255, 0.8)',
  };

  const glowColor = colorMap[color] || color;

  return (
    <Component
      className={`relative inline-block rounded-full overflow-hidden transition-all duration-300 ${className}`}
      {...(rest as any)}
      style={{
        padding: `${thickness}px`,
        ...(rest as any).style
      }}
    >
      {/* Animated border glow container - stays behind content */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
        style={{ padding: 0 }}
      >
        {/* Bottom-right moving glow */}
        <div
          className="absolute w-[200%] h-[100px] opacity-60 bottom-0 right-[-100%] blur-md animate-star-movement-bottom"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}, transparent 60%)`,
            animationDuration: speed,
          }}
        />
        {/* Top-left moving glow */}
        <div
          className="absolute w-[200%] h-[100px] opacity-60 top-0 left-[-100%] blur-md animate-star-movement-top"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}, transparent 60%)`,
            animationDuration: speed,
          }}
        />
        {/* Subtle static border overlay for definition */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `1px solid ${glowColor.replace('0.8', '0.3')}`,
          }}
        />
      </div>
      
      {/* Content wrapper with frosty glass effect */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-full px-6 py-2.5 text-sm font-medium border border-white/20 hover:bg-white/20 hover:backdrop-blur-lg transition-all duration-300">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
