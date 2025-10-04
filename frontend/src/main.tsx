import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const start = async () => {
  if (import.meta.env?.VITE_MOCK === "1") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
  createRoot(document.getElementById("root")!).render(<App />);
};

start();
