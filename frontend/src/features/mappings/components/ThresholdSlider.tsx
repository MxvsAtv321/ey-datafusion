import React from 'react';
import { Slider } from '@/components/ui/slider';

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const ThresholdSlider: React.FC<ThresholdSliderProps> = ({
  value,
  onChange,
  min = 0.3,
  max = 0.95,
  step = 0.01,
}) => {
  const handleValueChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    let newValue = value;
    const stepSize = step;
    const pageSize = 0.05;

    switch (event.key) {
      case 'ArrowLeft':
        newValue = Math.max(min, value - stepSize);
        break;
      case 'ArrowRight':
        newValue = Math.min(max, value + stepSize);
        break;
      case 'PageUp':
        newValue = Math.min(max, value + pageSize);
        break;
      case 'PageDown':
        newValue = Math.max(min, value - pageSize);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }

    event.preventDefault();
    onChange(Math.round(newValue / step) * step);
  };

  const formatValue = (val: number) => {
    return (val * 100).toFixed(0) + '%';
  };

  return (
    <div className="flex items-center space-x-4">
      <label htmlFor="threshold-slider" className="text-sm font-medium">
        Confidence Threshold
      </label>
      <div className="flex-1 max-w-xs">
        <Slider
          id="threshold-slider"
          data-testid="threshold-slider"
          value={[value]}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          onKeyDown={handleKeyDown}
          className="w-full"
          aria-label="Confidence threshold"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={`${formatValue(value)} confidence threshold`}
        />
      </div>
      <div className="text-sm font-mono min-w-[3rem] text-right">
        {formatValue(value)}
      </div>
    </div>
  );
};
