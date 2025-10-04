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
  min = 0.5,
  max = 0.95,
  step = 0.05,
}) => {
  const handleValueChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    let newValue = value;
    const stepSize = step;
    const pageSize = 0.1;

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
    <div className="space-y-2">
      <label htmlFor="threshold-slider" className="text-sm font-medium">
        Confidence Threshold: {formatValue(value)}
      </label>
      <Slider
        id="threshold-slider"
        data-testid="threshold-slider"
        value={[value * 100]}
        onValueChange={(newValue) => onChange(newValue[0] / 100)}
        min={min * 100}
        max={max * 100}
        step={step * 100}
        onKeyDown={handleKeyDown}
        className="w-full"
        showConfidenceColors={true}
        aria-label="Confidence threshold"
        aria-valuenow={value * 100}
        aria-valuemin={min * 100}
        aria-valuemax={max * 100}
        aria-valuetext={`${formatValue(value)} confidence threshold`}
      />
      <p className="text-xs text-muted-foreground">
        Mappings above this threshold are auto-accepted
      </p>
    </div>
  );
};
