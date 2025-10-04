import { useStore } from "@/state/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Database, Key, ArrowRight, TrendingUp } from "lucide-react";
import { DType } from "@/api/types";

const dtypeBadgeColors: Record<DType, string> = {
  string: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  integer: "bg-green-500/10 text-green-700 dark:text-green-400",
  number: "bg-green-500/10 text-green-700 dark:text-green-400",
  boolean: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  datetime: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

export default function ProfilePage() {
  const { profiles, setCurrentStep, setBaselineProfile } = useStore();
  const navigate = useNavigate();

  const handleProceed = () => {
    setCurrentStep(2);
    navigate("/mapping");
  };

  const handleSetBaseline = (profile: any) => {
    setBaselineProfile(profile);
  };

  if (Object.keys(profiles).length === 0) {
    return (
      <div className="container max-w-6xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No profiles available</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Upload Files
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Profiles</h2>
          <p className="text-muted-foreground mt-2">
            Review data quality, types, and semantic tags
          </p>
        </div>
        <Button onClick={handleProceed} size="lg">
          Proceed to Mapping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(profiles).map(([filename, profile]) => (
          <Card key={filename}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{filename}</CardTitle>
                  <CardDescription>
                    Table: {profile.table}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Database className="h-3 w-3" />
                    {profile.row_count.toLocaleString()} rows
                  </Badge>
                  {profile.candidate_primary_keys_sampled.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Key className="h-3 w-3" />
                      PK: {profile.candidate_primary_keys_sampled.join(", ")}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                        Column
                      </th>
                      <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                        Type
                      </th>
                      <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                        Nulls
                      </th>
                      <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                        Unique (sampled)
                      </th>
                      <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                        Semantic Tags
                      </th>
                      <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                        Examples
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.columns.map((col, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="data-cell font-mono font-medium">
                          {col.name}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="secondary"
                            className={dtypeBadgeColors[col.dtype]}
                          >
                            {col.dtype}
                          </Badge>
                        </td>
                        <td className="data-cell">
                          {col.null_count > 0 ? (
                            <span className="text-warning">{col.null_count}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="data-cell">{col.unique_count_sampled}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {col.semantic_tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="data-cell">
                          <div className="flex gap-1 font-mono text-xs text-muted-foreground">
                            {col.examples.slice(0, 3).map((ex, i) => (
                              <span key={i} className="truncate max-w-[100px]">
                                {ex}
                                {i < 2 && ","}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetBaseline(profile)}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Set as Baseline for Drift
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
