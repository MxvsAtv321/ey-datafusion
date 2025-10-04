import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showConfidenceColors?: boolean;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showConfidenceColors = false, ...props }, ref) => {
  const getConfidenceColor = (value: number) => {
    if (!showConfidenceColors) return "bg-primary";
    
    if (value >= 90) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (value >= 80) return "bg-gradient-to-r from-green-400 to-green-500";
    if (value >= 70) return "bg-gradient-to-r from-yellow-400 to-green-400";
    if (value >= 60) return "bg-gradient-to-r from-orange-400 to-yellow-400";
    return "bg-gradient-to-r from-red-400 to-orange-400";
  };

  const getThumbColor = (value: number) => {
    if (!showConfidenceColors) return "border-primary";
    
    if (value >= 90) return "border-green-500";
    if (value >= 80) return "border-green-400";
    if (value >= 70) return "border-yellow-400";
    if (value >= 60) return "border-orange-400";
    return "border-red-400";
  };

  const currentValue = props.value?.[0] || 0;
  const rangeColor = getConfidenceColor(currentValue);
  const thumbColor = getThumbColor(currentValue);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className={cn("absolute h-full transition-all duration-300", rangeColor)} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={cn(
        "block h-5 w-5 rounded-full border-2 bg-background ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        thumbColor
      )} />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
