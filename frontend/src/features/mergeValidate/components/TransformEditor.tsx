import React, { useState } from 'react';
import { TransformSpec, TransformKind } from '@/types/transform';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, GripVertical, Trash2 } from 'lucide-react';

interface TransformEditorProps {
  transforms: TransformSpec[];
  availableColumns: string[];
  onTransformsChange: (transforms: TransformSpec[]) => void;
  onApply: () => void;
  isApplying?: boolean;
}

const TRANSFORM_KINDS: { value: TransformKind; label: string }[] = [
  { value: 'concat', label: 'Concatenate' },
  { value: 'trim_spaces', label: 'Trim Spaces' },
  { value: 'to_upper', label: 'To Uppercase' },
  { value: 'to_lower', label: 'To Lowercase' },
  { value: 'to_title', label: 'To Title Case' },
  { value: 'cast_number', label: 'Cast to Number' },
  { value: 'cast_date', label: 'Cast to Date' },
];

export const TransformEditor: React.FC<TransformEditorProps> = ({
  transforms,
  availableColumns,
  onTransformsChange,
  onApply,
  isApplying = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTransform, setNewTransform] = useState<Partial<TransformSpec>>({
    kind: 'trim_spaces',
    enabled: true,
    options: {},
  });

  const addTransform = () => {
    if (!newTransform.targetColumn || !newTransform.kind) return;

    const transform: TransformSpec = {
      id: `transform-${Date.now()}`,
      targetColumn: newTransform.targetColumn,
      kind: newTransform.kind,
      inputs: newTransform.inputs || [],
      options: newTransform.options || {},
      enabled: true,
    };

    onTransformsChange([...transforms, transform]);
    setNewTransform({
      kind: 'trim_spaces',
      enabled: true,
      options: {},
    });
    setIsDialogOpen(false);
  };

  const updateTransform = (id: string, updates: Partial<TransformSpec>) => {
    onTransformsChange(
      transforms.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  };

  const removeTransform = (id: string) => {
    onTransformsChange(transforms.filter(t => t.id !== id));
  };

  const moveTransform = (id: string, direction: 'up' | 'down') => {
    const index = transforms.findIndex(t => t.id === id);
    if (index === -1) return;

    const newTransforms = [...transforms];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < transforms.length) {
      [newTransforms[index], newTransforms[targetIndex]] = [newTransforms[targetIndex], newTransforms[index]];
      onTransformsChange(newTransforms);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transform Editor</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="btn-add-transform">
                <Plus className="h-4 w-4 mr-2" />
                Add Transform
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transform</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="target-column">Target Column</Label>
                  <Select
                    value={newTransform.targetColumn || ''}
                    onValueChange={(value) => setNewTransform({ ...newTransform, targetColumn: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transform-kind">Transform Type</Label>
                  <Select
                    value={newTransform.kind || ''}
                    onValueChange={(value) => setNewTransform({ ...newTransform, kind: value as TransformKind })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transform" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSFORM_KINDS.map(kind => (
                        <SelectItem key={kind.value} value={kind.value}>
                          {kind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newTransform.kind === 'concat' && (
                  <div>
                    <Label htmlFor="inputs">Input Columns (comma-separated)</Label>
                    <Input
                      placeholder="first_name,last_name"
                      value={newTransform.inputs?.join(',') || ''}
                      onChange={(e) => setNewTransform({
                        ...newTransform,
                        inputs: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                )}

                {newTransform.kind === 'concat' && (
                  <div>
                    <Label htmlFor="separator">Separator</Label>
                    <Input
                      placeholder=" "
                      value={newTransform.options?.separator || ' '}
                      onChange={(e) => setNewTransform({
                        ...newTransform,
                        options: { ...newTransform.options, separator: e.target.value }
                      })}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addTransform} disabled={!newTransform.targetColumn || !newTransform.kind}>
                    Add Transform
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transforms.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transforms defined. Add one to get started.</p>
        ) : (
          <div className="space-y-2">
            {transforms.map((transform, index) => (
              <div
                key={transform.id}
                className="flex items-center space-x-2 p-2 border rounded-lg"
                data-testid={`transform-row-${transform.id}`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{transform.targetColumn}</Badge>
                    <span className="text-sm">{TRANSFORM_KINDS.find(k => k.value === transform.kind)?.label}</span>
                    {transform.kind === 'concat' && transform.inputs && (
                      <span className="text-xs text-muted-foreground">
                        ({transform.inputs.join(', ')})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveTransform(transform.id, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveTransform(transform.id, 'down')}
                    disabled={index === transforms.length - 1}
                  >
                    ↓
                  </Button>
                  
                  <Switch
                    checked={transform.enabled}
                    onCheckedChange={(checked) => updateTransform(transform.id, { enabled: checked })}
                    data-testid={`toggle-transform-${transform.id}`}
                  />
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTransform(transform.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={onApply}
          disabled={isApplying || transforms.length === 0}
          className="w-full"
          data-testid="btn-apply-transforms"
        >
          {isApplying ? 'Applying...' : 'Apply Transforms'}
        </Button>
      </CardContent>
    </Card>
  );
};
