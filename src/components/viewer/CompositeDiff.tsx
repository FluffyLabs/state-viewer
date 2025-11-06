import { useState } from 'react';
import CompositeViewer from './CompositeViewer';
import {Button, ButtonGroup} from '@fluffylabs/shared-ui';

type DisplayMode = 'decoded' | 'raw' | 'string';

interface CompositeDiffProps {
  beforeValue: unknown;
  afterValue: unknown;
  beforeRawValue?: string;
  afterRawValue?: string;
  showBytesLength?: boolean;
}

const CompositeDiff = ({
  beforeValue,
  afterValue,
  beforeRawValue,
  afterRawValue,
  showBytesLength = false,
}: CompositeDiffProps) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('decoded');

  const stringifyValue = (val: unknown): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && 'toJSON' in val && typeof val.toJSON === 'function') {
      return JSON.stringify(val.toJSON(), null, 2);
    }
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  const getDisplayContent = (value: unknown, rawValue?: string): { content: string; type: 'raw' | 'text' } => {
    if (displayMode === 'raw' && rawValue !== undefined) {
      return { content: rawValue, type: 'raw' };
    }
    if (displayMode === 'string') {
      return { content: stringifyValue(value), type: 'text' };
    }
    // For decoded mode, we'll use stringified version for diff
    return { content: stringifyValue(value), type: 'text' };
  };

  const computeLineDiff = (before: string, after: string): Array<{type: 'same' | 'removed' | 'added', line: string}> => {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    // Simple line-by-line diff (not LCS, but works for most cases)
    const result: Array<{type: 'same' | 'removed' | 'added', line: string}> = [];
    let i = 0, j = 0;

    while (i < beforeLines.length || j < afterLines.length) {
      if (i >= beforeLines.length) {
        // Only after lines remain
        result.push({ type: 'added', line: afterLines[j] });
        j++;
      } else if (j >= afterLines.length) {
        // Only before lines remain
        result.push({ type: 'removed', line: beforeLines[i] });
        i++;
      } else if (beforeLines[i] === afterLines[j]) {
        // Lines match
        result.push({ type: 'same', line: beforeLines[i] });
        i++;
        j++;
      } else {
        // Lines differ - look ahead to see if we can find a match
        const beforeInAfter = afterLines.slice(j).indexOf(beforeLines[i]);
        const afterInBefore = beforeLines.slice(i).indexOf(afterLines[j]);

        if (beforeInAfter === -1 && afterInBefore === -1) {
          // No match found, treat as replacement
          result.push({ type: 'removed', line: beforeLines[i] });
          result.push({ type: 'added', line: afterLines[j] });
          i++;
          j++;
        } else if (beforeInAfter !== -1 && (afterInBefore === -1 || beforeInAfter < afterInBefore)) {
          // Found before line in after, mark intermediate as added
          result.push({ type: 'added', line: afterLines[j] });
          j++;
        } else {
          // Found after line in before, mark intermediate as removed
          result.push({ type: 'removed', line: beforeLines[i] });
          i++;
        }
      }
    }

    return result;
  };

  const renderInlineDiff = () => {
    const beforeContent = getDisplayContent(beforeValue, beforeRawValue);
    const afterContent = getDisplayContent(afterValue, afterRawValue);

    if (displayMode === 'decoded') {
      // For decoded mode, show before/after side by side as it's complex
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            <CompositeViewer value={beforeValue} rawValue={beforeRawValue} showBytesLength={showBytesLength} />
          </div>
          <div className="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-2 rounded">
            <CompositeViewer value={afterValue} rawValue={afterRawValue} showBytesLength={showBytesLength} />
          </div>
        </div>
      );
    }

    const diff = computeLineDiff(beforeContent.content, afterContent.content);

    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
        <pre className="text-xs font-mono overflow-auto max-h-96">
          {diff.map((line, idx) => {
            const bgColor = line.type === 'added'
              ? 'bg-green-100 dark:bg-green-900/30'
              : line.type === 'removed'
              ? 'bg-red-100 dark:bg-red-900/30'
              : '';
            const textColor = line.type === 'added'
              ? 'text-green-800 dark:text-green-300'
              : line.type === 'removed'
              ? 'text-red-800 dark:text-red-300'
              : 'text-gray-800 dark:text-gray-200';
            const prefix = line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  ';

            return (
              <div key={`${line.type}-${line.line}-${idx}`} className={`${bgColor} ${textColor} px-2 py-0.5`}>
                {prefix}{line.line}
              </div>
            );
          })}
        </pre>
      </div>
    );
  };

  const renderDisplayModeButtons = () => (
    <ButtonGroup className="border-1 rounded-lg border-gray-300 dark:border-gray-600 bg-background">
      <Button
        size="sm"
        disabled={displayMode === 'decoded'}
        className={displayMode === 'decoded' ? 'underline' : ''}
        variant="ghost"
        intent="neutralStrong"
        onClick={() => setDisplayMode('decoded')}
      >
        Decoded
      </Button>
      {(beforeRawValue !== undefined || afterRawValue !== undefined) && (
        <Button
          size="sm"
          disabled={displayMode === 'raw'}
          className={displayMode === 'raw' ? 'underline' : ''}
          variant="ghost"
          intent="neutralStrong"
          onClick={() => setDisplayMode('raw')}
        >
          Raw
        </Button>
      )}
      <Button
        size="sm"
        disabled={displayMode === 'string'}
        className={displayMode === 'string' ? 'underline' : ''}
        variant="ghost"
        intent="neutralStrong"
        onClick={() => setDisplayMode('string')}
      >
        String
      </Button>
    </ButtonGroup>
  );

  return (
    <div className="space-y-2 rounded-sm">
      <div className="bg-background">
        {renderInlineDiff()}
      </div>
      <div className="flex items-center gap-4">
        {renderDisplayModeButtons()}
      </div>
    </div>
  );
};

export default CompositeDiff;
