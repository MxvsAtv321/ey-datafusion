import { useEffect, useState } from "react";
import { api } from "@/api/client";

export function SecureBadge() {
  const [h, setH] = useState<{ regulated_mode: boolean; embeddings_enabled: boolean; masking_policy?: { match_explain: boolean; profile_examples_masked: boolean } } | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await api.getHealth();
        if (alive) setH({ regulated_mode: !!res.regulated_mode, embeddings_enabled: !!res.embeddings_enabled, masking_policy: res.masking_policy });
      } catch {
        // ignore
      }
    };
    load();
    const id = window.setInterval(load, 60000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const title = h?.regulated_mode ? "Secure Mode" : "Standard Mode";
  const subtitle = h?.regulated_mode ? "masked samples" : (h?.embeddings_enabled ? "semantic on" : "semantic off");

  return (
    <div aria-label="security-mode" aria-live="polite" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border border-slate-300 dark:border-slate-600">
      <span className={`h-2 w-2 rounded-full ${h?.regulated_mode ? "bg-emerald-500" : "bg-amber-500"}`} />
      <span className="font-medium">{title}</span>
      <span className="text-slate-500">• {subtitle}</span>
      {h?.masking_policy && (
        <span className="sr-only">
          {`Masking: explain=${h.masking_policy.match_explain}, profile=${h.masking_policy.profile_examples_masked}`}
        </span>
      )}
    </div>
  );
}


