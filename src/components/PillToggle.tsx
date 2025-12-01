import { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface PillToggleOption {
  value: string;
  label: string;
}

interface PillToggleProps {
  value: string;
  onChange: (value: string) => void;
  options: PillToggleOption[];
}

export const PillToggle = ({ value, onChange, options }: PillToggleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!indicatorRef.current || !containerRef.current) return;
    
    const activeIndex = options.findIndex(opt => opt.value === value);
    const activeButton = buttonsRef.current[activeIndex];
    
    if (activeButton) {
      gsap.to(indicatorRef.current, {
        x: activeButton.offsetLeft - 4,
        width: activeButton.offsetWidth,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, [value, options]);

  return (
    <div 
      ref={containerRef}
      className="relative inline-flex bg-muted/50 backdrop-blur-sm rounded-full p-1 border border-border/50"
    >
      {/* Sliding indicator */}
      <div
        ref={indicatorRef}
        className="absolute top-1 bottom-1 bg-primary rounded-full shadow-lg"
        style={{ width: 0 }}
      />
      
      {/* Options */}
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={el => buttonsRef.current[index] = el}
          onClick={() => onChange(option.value)}
          className={`
            relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-200
            ${value === option.value 
              ? "text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
