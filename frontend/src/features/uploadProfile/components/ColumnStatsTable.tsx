import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { ColumnSummary, DatasetProfile } from "@/types/profile";
import { cn } from "@/lib/utils";

interface ColumnStatsTableProps {
  profile: DatasetProfile;
  testId: string;
}

export const ColumnStatsTable = ({ profile, testId }: ColumnStatsTableProps) => {
  const [showSample, setShowSample] = useState(false);

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "string": return "secondary";
      case "number": return "default";
      case "boolean": return "outline";
      case "date": return "destructive";
      default: return "secondary";
    }
  };

  const getBlanksColor = (pct: number) => {
    if (pct === 0) return "text-green-600";
    if (pct <= 10) return "text-yellow-600";
    return "text-red-600";
  };

  const handleToggleSample = () => {
    setShowSample(!showSample);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggleSample();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Column Statistics</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSample}
            onKeyDown={handleKeyDown}
            data-testid={`toggle-sample-${testId}`}
            aria-expanded={showSample}
            aria-label={showSample ? "Hide sample rows" : "Show sample rows"}
          >
            {showSample ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Sample
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                View Sample
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Blanks %</TableHead>
                <TableHead>Example Values</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.columns.map((column, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{column.name}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(column.inferredType)}>
                      {column.inferredType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn("font-medium", getBlanksColor(column.blanksPct))}>
                      {column.blanksPct.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate">
                        {column.exampleValues.slice(0, 3).join(", ")}
                        {column.exampleValues.length > 3 && "..."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Collapsible open={showSample} onOpenChange={setShowSample}>
          <CollapsibleContent className="space-y-2">
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Sample Rows ({profile.sampleRows.length} shown)
              </h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {profile.columns.map((column, index) => (
                        <TableHead key={index} className="min-w-[120px]">
                          {column.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.sampleRows.slice(0, 10).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {profile.columns.map((column, colIndex) => (
                          <TableCell key={colIndex} className="max-w-[200px]">
                            <div className="truncate" title={String(row[column.name] ?? "")}>
                              {row[column.name] === null ? (
                                <span className="text-gray-400 italic">null</span>
                              ) : (
                                String(row[column.name])
                              )}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

