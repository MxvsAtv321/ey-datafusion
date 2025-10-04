import { useEffect } from "react";
import { useStore } from "@/state/store";

export function SecureBadge() {
  const { health, healthLoading, fetchHealth, startAutoRefresh } = useStore((s) => ({
    health: s.health,
    healthLoading: s.healthLoading,
    fetchHealth: s.fetchHealth,
    startAutoRefresh: s.startAutoRefresh,
  }));

  useEffect(() => {
    fetchHealth();
    startAutoRefresh(60000);
  }, [fetchHealth, startAutoRefresh]);

  const title = health?.regulated_mode ? "Secure Mode" : "Standard Mode";
  const subtitle = health?.regulated_mode ? "masked samples" : (health?.embeddings_enabled ? "semantic on" : "semantic off");

  return (
    <div aria-label="security-mode" aria-live="polite" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border border-slate-300 dark:border-slate-600">
      <span className={`h-2 w-2 rounded-full ${health?.regulated_mode ? "bg-emerald-500" : "bg-amber-500"}`} />
      <span className="font-medium">{title}</span>
      <span className="text-slate-500">• {subtitle}</span>
      {health?.masking_policy && (
        <span className="sr-only">
          {`Masking: explain=${health.masking_policy.match_explain}, profile=${health.masking_policy.profile_examples_masked}`}
        </span>
      )}
    </div>
  );
}


