import type { WaveBackgroundProps } from '../types/components';

export default function WaveBackground({ children, className = "" }: WaveBackgroundProps) {
  return (
    <div className={`wave-container ${className}`}>
      <div className="wave">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

