import { ReactNode } from 'react';

interface ArrayViewerProps {
  array: unknown[];
  renderValue: (value: unknown) => ReactNode;
}

const ArrayViewer = ({ array, renderValue }: ArrayViewerProps) => {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 mb-2">Array ({array.length} items)</div>
      {array.map((item, index) => (
        <details key={index} className="border-l-2 border-gray-200 pl-2">
          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
            [{index}] {item === null ? 'null' : typeof item === 'object' ? '{...}' : String(item).slice(0, 50)}
            {typeof item !== 'object' && String(item).length > 50 && '...'}
          </summary>
          {renderValue(item)}
        </details>
      ))}
    </div>
  );
};

export default ArrayViewer;