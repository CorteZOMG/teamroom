import React from 'react';
import type { HoverState } from '../hooks/useHoverAnimation';

interface AnimatedTextProps {
  children: React.ReactNode;
  hoverState: HoverState;
  isLeftSide?: boolean;
  className?: string;
  transitionDuration?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  hoverState,
  isLeftSide = true,
  className = '',
  transitionDuration = 0.3
}) => {
  const { isLeftHovered, isRightHovered } = hoverState;
  
  // Determine text color based on which side is active
  const shouldBeWhite = isLeftSide ? isLeftHovered : isRightHovered;
  const shouldBePrimary = isLeftSide ? !isLeftHovered : !isRightHovered;

  const textColorClass = shouldBeWhite 
    ? 'text-white' 
    : shouldBePrimary 
    ? 'text-primary' 
    : 'text-white';

  return (
    <div
      className={`transition-colors duration-300 ease-out ${textColorClass} ${className}`}
      style={{
        transitionDuration: `${transitionDuration}s`,
      }}
    >
      {children}
    </div>
  );
};
