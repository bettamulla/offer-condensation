import { useEffect } from 'react';
import { summarizeHistory } from '../utils/compaction';

export function useAutoCompact(history: any[], tokenUsagePercent: number) {
  useEffect(() => {
    if (tokenUsagePercent > 75) {
      summarizeHistory(history).then(result => {
        console.log('Auto-compaction completed:', result);
      });
    }
  }, [history, tokenUsagePercent]);
}
