import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { StepperNav } from "@/components/StepperNav";
import UploadPage from "./pages/UploadPage";
import ProfilePage from "./pages/ProfilePage";
import MappingPage from "./pages/MappingPage";
import MergePage from "./pages/MergePage";
import ExportPage from "./pages/ExportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <div className="flex flex-1 w-full">
            <StepperNav />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<UploadPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/mapping" element={<MappingPage />} />
                <Route path="/merge" element={<MergePage />} />
                <Route path="/export" element={<ExportPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
