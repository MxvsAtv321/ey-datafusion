import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Database, Columns, AlertTriangle } from "lucide-react";
import { DatasetProfile } from "@/types/profile";
import { ColumnStatsTable } from "./ColumnStatsTable";

interface ProfileSummaryProps {
  profile: DatasetProfile;
  testId: string;
}

export const ProfileSummary = ({ profile, testId }: ProfileSummaryProps) => {
  const highBlanksCount = profile.columns.filter(col => col.blanksPct > 10).length;
  const totalColumns = profile.columns.length;

  return (
    <div className="space-y-4" data-testid={`profile-${testId}`}>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Rows Sampled</p>
                <p className="text-lg font-bold">{profile.rowCountSampled.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Columns className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Columns</p>
                <p className="text-lg font-bold">{totalColumns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">High Blanks</p>
                <p className="text-lg font-bold text-orange-600">{highBlanksCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-xs text-white font-bold">K</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Likely Keys</p>
                <p className="text-lg font-bold">{profile.likelyKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Likely Keys */}
      {profile.likelyKeys.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Likely Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.likelyKeys.slice(0, 3).map((key, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="font-mono">
                      {key.column}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{key.reason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={key.score * 100} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                      {Math.round(key.score * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Statistics Table */}
      <ColumnStatsTable profile={profile} testId={testId} />
    </div>
  );
};

