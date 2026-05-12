import React, { useRef, useState, useEffect, useCallback } from "react";

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  disabled?: boolean;
  className?: string;
  formatLabel?: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled = false,
  className = "",
  formatLabel = (v) => v.toString(),
}) => {
  const [draggingThumb, setDraggingThumb] = useState<0 | 1 | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const clamp = (val: number) => Math.min(max, Math.max(min, val));
  const stepSnap = (val: number) => Math.round(val / step) * step;

  const getRelativeX = (clientX: number): number => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    return Math.min(1, Math.max(0, x));
  };

  const valueFromX = (x: number): number => {
    return clamp(min + x * (max - min));
  };

  const xFromValue = (val: number): number => {
    return (clamp(val) - min) / (max - min);
  };

  const updateValue = useCallback(
    (clientX: number, thumb: 0 | 1) => {
      if (disabled) return;
      const newRaw = valueFromX(getRelativeX(clientX));
      let newVal = stepSnap(newRaw);
      newVal = clamp(newVal);

      if (thumb === 0) {
        // left thumb: cannot exceed right thumb - step
        const maxLeft = value[1] - step;
        newVal = Math.min(newVal, maxLeft);
        onChange([newVal, value[1]]);
      } else {
        const minRight = value[0] + step;
        newVal = Math.max(newVal, minRight);
        onChange([value[0], newVal]);
      }
    },
    [disabled, min, max, step, value, onChange, stepSnap],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingThumb !== null) {
        updateValue(e.clientX, draggingThumb);
      }
    },
    [draggingThumb, updateValue],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingThumb(null);
  }, []);

  useEffect(() => {
    if (draggingThumb !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingThumb, handleMouseMove, handleMouseUp]);

  const leftPercent = xFromValue(value[0]) * 100;
  const rightPercent = xFromValue(value[1]) * 100;

  // Keyboard handling
  const handleKeyDown = (thumb: 0 | 1, e: React.KeyboardEvent) => {
    if (disabled) return;
    const delta = e.shiftKey ? step * 10 : step;
    let newVal = value[thumb];
    if (e.key === "ArrowLeft") newVal -= delta;
    else if (e.key === "ArrowRight") newVal += delta;
    else return;

    newVal = clamp(stepSnap(newVal));

    if (thumb === 0) {
      newVal = Math.min(newVal, value[1] - step);
      onChange([newVal, value[1]]);
    } else {
      newVal = Math.max(newVal, value[0] + step);
      onChange([value[0], newVal]);
    }
    e.preventDefault();
  };

  return (
    <div className={`w-full select-none ${className}`}>
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>{formatLabel(value[0])}</span>
        <span>{formatLabel(value[1])}</span>
      </div>
      <div
        ref={sliderRef}
        className={`relative h-1.25 bg-neutral-500 rounded-full ${disabled ? "opacity-50" : ""}`}
        onMouseDown={(e) => {
          if (disabled) return;
          const x = getRelativeX(e.clientX);
          const clickVal = valueFromX(x);
          const distToLeft = Math.abs(clickVal - value[0]);
          const distToRight = Math.abs(clickVal - value[1]);
          const thumbToDrag = distToLeft < distToRight ? 0 : 1;
          setDraggingThumb(thumbToDrag);
          updateValue(e.clientX, thumbToDrag);
        }}
      >
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
        />

        <div
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value[0]}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => handleKeyDown(0, e)}
          className={`absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow 
            -translate-x-1/2 -translate-y-1/4 top-1/2 cursor-grab active:cursor-grabbing
            focus:ring-2 focus:ring-primary/40 focus:outline-none -mt-1
            ${disabled ? "cursor-not-allowed" : ""}`}
          style={{ left: `${leftPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (!disabled) setDraggingThumb(0);
          }}
        />
        <div
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => handleKeyDown(1, e)}
          className={`absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow 
            -translate-x-1/2 -translate-y-1/4 top-1/2 cursor-grab active:cursor-grabbing
            focus:ring-2 focus:ring-primary/40 -mt-1 focus:outline-none
            ${disabled ? "cursor-not-allowed" : ""}`}
          style={{ left: `${rightPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (!disabled) setDraggingThumb(1);
          }}
        />
      </div>
    </div>
  );
};
