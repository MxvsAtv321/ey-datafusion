import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = { open: boolean; onClose: () => void; onSave: (ops: any[]) => void; availableFields: string[]; initialOps?: any[] };

export default function TransformEditor({ open, onClose, onSave, availableFields, initialOps }: Props) {
  const [jsonText, setJsonText] = useState("[]");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(initialOps || [], null, 2));
  }, [initialOps]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array of ops");
      setError(null);
      onSave(parsed);
      onClose();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transform Editor</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="text-xs text-muted-foreground">Available fields: {availableFields.join(", ")}</div>
          <textarea className="w-full h-64 font-mono text-xs border rounded p-2" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


