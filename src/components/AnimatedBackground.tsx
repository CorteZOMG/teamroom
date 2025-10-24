import React from 'react';
import type { HoverState } from '../hooks/useHoverAnimation';

interface AnimatedBackgroundProps {
  hoverState: HoverState;
  transitionDuration?: number;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  hoverState,
  transitionDuration = 0.3
}) => {
  const { isLeftHovered, isRightHovered } = hoverState;

  return (
    <>
      {/* Left side background */}
      <div
        className={`absolute left-0 top-0 h-full transition-all duration-300 ease-out ${
          isLeftHovered ? 'w-[60%] bg-primary' : 'w-[40%] bg-white'
        }`}
        style={{
          transitionDuration: `${transitionDuration}s`,
        }}
      />
      
      {/* Right side background */}
      <div
        className={`absolute right-0 top-0 h-full transition-all duration-300 ease-out ${
          isRightHovered ? 'w-[60%] bg-primary' : 'w-[40%] bg-white'
        }`}
        style={{
          transitionDuration: `${transitionDuration}s`,
        }}
      />
    </>
  );
};
