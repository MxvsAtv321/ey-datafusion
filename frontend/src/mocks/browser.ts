import { setupWorker } from "msw/browser";
import { handlers } from "@/api/mock";

export const worker = setupWorker(...handlers);
