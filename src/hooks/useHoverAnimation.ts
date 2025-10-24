import { useState, useEffect, useCallback } from 'react';

export interface HoverState {
  isLeftHovered: boolean;
  isRightHovered: boolean;
  mouseX: number;
  mouseY: number;
}

interface HoverAnimationConfig {
  transitionDuration: number;
  scaleFactor: number;
  threshold: number; // Percentage of screen width to determine hover zones
}

const defaultConfig: HoverAnimationConfig = {
  transitionDuration: 0.3,
  scaleFactor: 1.05,
  threshold: 0.4 // 40% of screen width
};

export const useHoverAnimation = (config: Partial<HoverAnimationConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [hoverState, setHoverState] = useState<HoverState>({
    isLeftHovered: false,
    isRightHovered: true, // Start with right side active
    mouseX: 0,
    mouseY: 0
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const screenWidth = window.innerWidth;
    const mouseXPercentage = e.clientX / screenWidth;
    
    setHoverState(prev => ({
      ...prev,
      mouseX: e.clientX,
      mouseY: e.clientY,
      isLeftHovered: mouseXPercentage < finalConfig.threshold,
      isRightHovered: mouseXPercentage >= finalConfig.threshold
    }));
  }, [finalConfig.threshold]);

  const handleMouseLeave = useCallback(() => {
    setHoverState(prev => ({
      ...prev,
      isLeftHovered: false,
      isRightHovered: true // Reset to right side active
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return {
    hoverState,
    config: finalConfig
  };
};
