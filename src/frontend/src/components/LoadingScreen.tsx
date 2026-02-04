import { useEffect, useState } from 'react';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // One-second animation with smooth fade transition
    const animationTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    // Call onComplete after fade out completes
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1300);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundImage: 'url(/assets/generated/blueprint-loading-background.dim_1920x1080.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'oklch(0.45 0.15 240)',
        willChange: 'opacity',
      }}
    >
      {/* Animated grid overlay for subtle shimmer effect */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridShimmer 1s ease-in-out',
          willChange: 'opacity',
        }}
      />

      {/* Blueprint text reveal animation */}
      <div className="relative overflow-hidden px-8">
        <h1
          className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-wider select-none"
          style={{
            animation: 'textReveal 1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            clipPath: 'inset(0 100% 0 0)',
            textShadow: `
              0 0 20px rgba(255, 255, 255, 0.8),
              0 0 40px rgba(255, 255, 255, 0.5),
              0 0 60px rgba(255, 255, 255, 0.3),
              0 2px 4px rgba(0, 0, 0, 0.3)
            `,
            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.6))',
            willChange: 'clip-path',
          }}
        >
          Blueprint
        </h1>
      </div>

      {/* Rolling effect overlay - simulates unrolling blueprint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
          animation: 'rollEffect 1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          transform: 'translateX(-100%)',
          width: '200%',
          willChange: 'transform',
        }}
      />

      {/* Blueprint drawing lines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.05) 2px,
              rgba(255, 255, 255, 0.05) 4px
            )
          `,
          animation: 'drawingLines 1s ease-out forwards',
          willChange: 'opacity, transform',
        }}
      />

      <style>{`
        @keyframes textReveal {
          0% {
            clip-path: inset(0 100% 0 0);
          }
          100% {
            clip-path: inset(0 0% 0 0);
          }
        }

        @keyframes rollEffect {
          0% {
            transform: translateX(-100%);
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0.8;
          }
        }

        @keyframes gridShimmer {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes drawingLines {
          0% {
            opacity: 0;
            transform: translateY(-100%);
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
