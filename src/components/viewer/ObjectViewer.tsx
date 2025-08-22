import { ReactNode } from 'react';
import { shortenString, toSmartString } from './utils';

interface ObjectViewerProps {
  value: Record<string, unknown>;
  renderValue: (value: unknown) => ReactNode;
}

const ObjectViewer = ({ value, renderValue }: ObjectViewerProps) => {
  return (
    <div className="space-y-1" data-testid="object-viewer">
      {Object.keys(value).map((key) => {
        const item = value[key];
        const itemStr = toSmartString(item, {});
        const shortStr = shortenString(itemStr);
        return (
          <details key={key} className="border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            <summary className="cursor-pointer font-mono text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
              {key}: {shortStr}
            </summary>
            {renderValue(item)}
          </details>
        );
      })}
    </div>
  );
};

export default ObjectViewer;
