import { ReactNode } from 'react';
import { shortenString, toSmartString } from './utils';

interface ArrayViewerProps {
  array: unknown[];
  renderValue: (value: unknown) => ReactNode;
}

const ArrayViewer = ({ array, renderValue }: ArrayViewerProps) => {
  return (
    <div className="space-y-1" data-testid="array-viewer">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Array ({array.length} items)</div>
      {array.map((item, index) => {
        const itemStr = toSmartString(item);
        const shortStr = shortenString(itemStr);
        return (
          <details key={index} className="border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            <summary className="cursor-pointer font-mono text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
              [{index}] {shortStr}
            </summary>
            {renderValue(item)}
          </details>
        );
      })}
    </div>
  );
};

export default ArrayViewer;
