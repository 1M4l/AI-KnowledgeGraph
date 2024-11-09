import { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface VectorStoreProps {
  onVectorStored: () => void;
  isProcessing: boolean;
}

export function VectorStore({ onVectorStored, isProcessing }: VectorStoreProps) {
  useEffect(() => {
    if (!isProcessing) {
      onVectorStored();
    }
  }, [isProcessing, onVectorStored]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Processing documents...</span>
        <span>{isProcessing ? 'Processing' : 'Complete'}</span>
      </div>
      <Progress value={isProcessing ? 75 : 100} />
    </div>
  );
}