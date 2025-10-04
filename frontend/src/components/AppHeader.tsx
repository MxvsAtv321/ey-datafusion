import { Moon, Sun, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useStore } from "@/state/store";
import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";

export const AppHeader = () => {
  const { settings, toggleDarkMode, toggleDemoMode, setThreshold } = useStore();

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">EY</span>
          </div>
          <h1 className="text-lg font-semibold">DataFusion</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {settings.darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>
                  Configure your DataFusion experience
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="demo-mode" className="flex flex-col gap-1">
                    <span>Demo Mode</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Use mock data for testing
                    </span>
                  </Label>
                  <Switch
                    id="demo-mode"
                    checked={settings.demoMode}
                    onCheckedChange={toggleDemoMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">
                    Confidence Threshold: {(settings.threshold * 100).toFixed(0)}%
                  </Label>
                  <Slider
                    id="threshold"
                    min={50}
                    max={95}
                    step={5}
                    value={[settings.threshold * 100]}
                    onValueChange={([value]) => setThreshold(value / 100)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mappings above this threshold are auto-accepted
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
