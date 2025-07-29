import { useState } from 'react';
import ArrayViewer from './ArrayViewer';
import ObjectViewer from './ObjectViewer';
import ToStringViewer from './ToStringViewer';
import { Button } from '../ui';

type DisplayMode = 'decoded' | 'raw' | 'string';

interface CompositeViewerProps {
  value: unknown;
  rawValue?: string;
  showModeToggle?: boolean;
}

const CompositeViewer = ({ value, rawValue, showModeToggle = false }: CompositeViewerProps) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('decoded');

  const renderValue = (val: unknown) => <CompositeViewer value={val} />;

  // Render mode toggle if requested
  const modeToggle = showModeToggle && (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex rounded-md overflow-hidden">
        <Button
          size="sm"
          disabled={displayMode === 'decoded'}
          className={displayMode === 'decoded' ? 'underline' : ''}
          variant="link"
          onClick={() => setDisplayMode('decoded')}
        >
          Decoded
        </Button>
        {rawValue !== undefined && (<Button
          size="sm"
          disabled={displayMode === 'raw'}
          className={displayMode === 'raw' ? 'underline' : ''}
          variant="link"
          onClick={() => setDisplayMode('raw')}
        >
          Raw
        </Button>)}
        <Button
          size="sm"
          disabled={displayMode === 'string'}
          className={displayMode === 'string' ? 'underline' : ''}
          variant="link"
          onClick={() => setDisplayMode('string')}
        >
          String
        </Button>
      </div>
    </div>
  );

  // Handle raw mode
  if (displayMode === 'raw' && rawValue !== undefined) {
    return (
      <div>
        <pre className="mt-1 pl-2 text-xs font-mono bg-gray-50 dark-bg-background rounded p-2 break-all overflow-auto">
          {rawValue}
        </pre>
        {modeToggle}
      </div>
    );
  }

  // Handle string mode
  if (displayMode === 'string') {
    return (
      <div>
        <ToStringViewer value={value} />
        {modeToggle}
      </div>
    );
  }

  // Handle decoded mode (default behavior)
  const decodedContent = () => {
    if (value === null) {
      return <span className="text-gray-500 dark:text-gray-400 italic">null</span>;
    }
    if (typeof value === 'object' && 'toJSON' in value && typeof value.toJSON === 'function') {
      return <CompositeViewer value={value.toJSON()} />;
    }

    if (Array.isArray(value)) {
      return <ArrayViewer array={value} renderValue={renderValue} />;
    }

    if (typeof value === 'object' && Object.prototype.toString === value.toString) {
      return <ObjectViewer value={value as Record<string, unknown>} renderValue={renderValue} />;
    }

    return <ToStringViewer value={value} />;
  };

  return (
    <div>
      {decodedContent()}
      {modeToggle}
    </div>
  );
};

export default CompositeViewer;
