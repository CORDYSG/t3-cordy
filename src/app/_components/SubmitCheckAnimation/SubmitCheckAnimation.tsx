import { useEffect, useState } from "react";

const SubmitAnimation = ({
  color = "#e84855",
  size = 60,
  isSubmitting = false,
  isComplete = false,
  onComplete = () => {},
}) => {
  const [showTick, setShowTick] = useState(false);

  useEffect(() => {
    if (isComplete && !showTick) {
      // Small delay before showing tick for smooth transition
      const timer = setTimeout(() => {
        setShowTick(true);
        onComplete();
      }, 300);
      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setShowTick(false);
    }
  }, [isComplete, showTick, onComplete]);

  const pulseKeyframes = `
    @keyframes energetic-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      25% { transform: scale(1.1); opacity: 0.8; }
      50% { transform: scale(0.95); opacity: 1; }
      75% { transform: scale(1.05); opacity: 0.9; }
    }
    
    @keyframes orbit {
      0% { transform: rotate(0deg) translateX(${size * 0.4}px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(${size * 0.4}px) rotate(-360deg); }
    }
    
    @keyframes tick-draw {
      0% { stroke-dashoffset: 100; }
      100% { stroke-dashoffset: 0; }
    }
    
    @keyframes success-scale {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes success-glow {
  
    }
  `;

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Main circle */}
        <div
          className={`absolute inset-0 rounded-full border-4 transition-all duration-500 ${
            isSubmitting && !showTick ? "animate-pulse" : ""
          }`}
          style={{
            borderColor: showTick ? color : `${color}40`,
            backgroundColor: showTick ? color : "transparent",
            animation:
              isSubmitting && !showTick
                ? "energetic-pulse 1.5s ease-in-out infinite"
                : showTick
                  ? "success-scale 0.6s ease-out, success-glow 2s ease-in-out infinite"
                  : "none",
          }}
        />

        {/* Orbiting dots */}
        {isSubmitting && !showTick && (
          <>
            {[0, 120, 240].map((delay, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  animation: `orbit 2s linear infinite`,
                  animationDelay: `${delay / 120}s`,
                }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}60`,
                  }}
                />
              </div>
            ))}
          </>
        )}

        {/* Success tick */}
        {showTick && (
          <svg
            width={size * 0.5}
            height={size * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            className="absolute"
            style={{
              animation: "success-scale 0.6s ease-out",
            }}
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="100"
              style={{
                animation: "tick-draw 0.8s ease-out forwards",
              }}
            />
          </svg>
        )}

        {/* Inner glow effect */}
        {isSubmitting && !showTick && (
          <div
            className="absolute inset-2 rounded-full opacity-30"
            style={{
              backgroundColor: color,
              animation: "energetic-pulse 1.5s ease-in-out infinite reverse",
            }}
          />
        )}
      </div>
    </>
  );
};

export default SubmitAnimation;
