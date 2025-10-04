import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Building } from "lucide-react";
import { cn } from "@/lib/utils";

interface BankSelectorProps {
  selectedBank: "bankA" | "bankB";
  onBankChange: (bank: "bankA" | "bankB") => void;
  bankAStats: {
    rowCount: number;
    columnCount: number;
    highBlanksCount: number;
    likelyKeysCount: number;
  };
  bankBStats: {
    rowCount: number;
    columnCount: number;
    highBlanksCount: number;
    likelyKeysCount: number;
  };
}

export const BankSelector = ({ 
  selectedBank, 
  onBankChange, 
  bankAStats, 
  bankBStats 
}: BankSelectorProps) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">Dataset Profile</h2>
            <Badge variant="outline" className="text-sm">
              {selectedBank === "bankA" ? "Bank A" : "Bank B"}
            </Badge>
          </div>
          
          {/* Bank Toggle Slider */}
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedBank === "bankA" ? "default" : "outline"}
              onClick={() => onBankChange("bankA")}
              className={cn(
                "flex items-center space-x-2 transition-all duration-200",
                selectedBank === "bankA" && "shadow-md"
              )}
            >
              <Building2 className="w-4 h-4" />
              <span>Bank A</span>
            </Button>
            
            <div 
              className="relative cursor-pointer"
              onClick={() => onBankChange(selectedBank === "bankA" ? "bankB" : "bankA")}
            >
              <div className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors duration-200",
                selectedBank === "bankA" ? "bg-gray-200" : "bg-blue-500"
              )}>
                <div 
                  className={cn(
                    "w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200",
                    selectedBank === "bankB" && "translate-x-6"
                  )}
                />
              </div>
            </div>
            
            <Button
              variant={selectedBank === "bankB" ? "default" : "outline"}
              onClick={() => onBankChange("bankB")}
              className={cn(
                "flex items-center space-x-2 transition-all duration-200",
                selectedBank === "bankB" && "shadow-md"
              )}
            >
              <Building className="w-4 h-4" />
              <span>Bank B</span>
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Preview */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {selectedBank === "bankA" ? bankAStats.rowCount.toLocaleString() : bankBStats.rowCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Rows</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {selectedBank === "bankA" ? bankAStats.columnCount : bankBStats.columnCount}
            </p>
            <p className="text-sm text-gray-600">Columns</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {selectedBank === "bankA" ? bankAStats.highBlanksCount : bankBStats.highBlanksCount}
            </p>
            <p className="text-sm text-gray-600">High Blanks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {selectedBank === "bankA" ? bankAStats.likelyKeysCount : bankBStats.likelyKeysCount}
            </p>
            <p className="text-sm text-gray-600">Likely Keys</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
