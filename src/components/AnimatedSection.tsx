import React from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  isHovered: boolean;
  className?: string;
  style?: React.CSSProperties;
  transitionDuration?: number;
  scaleFactor?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  isHovered,
  className = '',
  style = {},
  transitionDuration = 0.3,
  scaleFactor = 1.05
}) => {
  const scale = isHovered ? scaleFactor : 1;
  const zIndex = isHovered ? 10 : 1;

  return (
    <div
      className={`transition-all duration-300 ease-out ${className}`}
      style={{
        transform: `scale(${scale})`,
        zIndex,
        transitionDuration: `${transitionDuration}s`,
        transformOrigin: 'center',
        transitionProperty: 'transform, z-index, left, right, width, display, justify-content, align-items',
        ...style
      }}
    >
      {children}
    </div>
  );
};
