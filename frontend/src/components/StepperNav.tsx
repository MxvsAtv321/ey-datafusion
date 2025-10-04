import { cn } from "@/lib/utils";
import { useStore } from "@/state/store";
import { Check, Upload, FileText, GitMerge, CheckCircle, FileDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const steps = [
  { id: 0, name: "Upload", icon: Upload, path: "/" },
  { id: 1, name: "Profile", icon: FileText, path: "/profile" },
  { id: 2, name: "Mapping", icon: GitMerge, path: "/mapping" },
  { id: 3, name: "Merge & Validate", icon: CheckCircle, path: "/merge-validate" },
  { id: 4, name: "Export", icon: FileDown, path: "/export" },
];

export const StepperNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStep, setCurrentStep } = useStore();

  // Determine current step based on location
  const getCurrentStepFromLocation = () => {
    const pathname = location.pathname;
    if (pathname === "/" || pathname === "/upload-profile") return 0;
    if (pathname === "/profile") return 1;
    if (pathname === "/mapping" || pathname === "/mappings/suggest") return 2;
    if (pathname === "/merge-validate") return 3;
    if (pathname === "/export") return 4;
    return 0; // default to first step
  };

  const actualCurrentStep = getCurrentStepFromLocation();

  const handleStepClick = (step: typeof steps[0]) => {
    if (step.id <= actualCurrentStep) {
      setCurrentStep(step.id);
      navigate(step.path);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path === "/profile" && location.pathname === "/profile") return true;
    if (path === "/mapping" && (location.pathname === "/mapping" || location.pathname === "/mappings/suggest")) return true;
    if (path === "/merge-validate" && location.pathname === "/merge-validate") return true;
    if (path === "/export" && location.pathname === "/export") return true;
    return false;
  };

  return (
    <nav className="w-64 border-r bg-muted/30 p-6" aria-label="Progress">
      <ol className="space-y-2">
        {steps.map((step, idx) => {
          const isCompleted = step.id < actualCurrentStep;
          const isCurrent = step.id === actualCurrentStep;
          const isClickable = step.id <= actualCurrentStep;

          return (
            <li key={step.id}>
              <button
                onClick={() => handleStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                  "focus-ring",
                  isClickable && "cursor-pointer hover:bg-muted",
                  !isClickable && "cursor-not-allowed opacity-50",
                  isActive(step.path) && "bg-primary text-primary-foreground",
                  !isActive(step.path) && isCompleted && "text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isActive(step.path) &&
                      "border-primary-foreground bg-primary-foreground text-primary",
                    !isActive(step.path) &&
                      isCompleted &&
                      "border-success bg-success text-success-foreground",
                    !isActive(step.path) &&
                      !isCompleted &&
                      isCurrent &&
                      "border-primary bg-background text-primary",
                    !isActive(step.path) &&
                      !isCompleted &&
                      !isCurrent &&
                      "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{step.name}</div>
                  <div className="text-xs opacity-80">
                    Step {step.id + 1} of {steps.length}
                  </div>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "ml-7 mt-1 mb-1 h-8 w-0.5 transition-colors",
                    isCompleted ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
