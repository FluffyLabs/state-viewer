import { ReactNode } from 'react';

interface ObjectViewerProps {
  value: Record<string, unknown>;
  renderValue: (value: unknown) => ReactNode;
}

const ObjectViewer = ({ value, renderValue }: ObjectViewerProps) => {
  return (
    <div className="space-y-1">
      {Object.keys(value).map((key) => {
        const item = value[key];
        return (
          <details key={key} className="border-l-2 border-gray-200 pl-2">
            <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
              {key}: {item === null ? 'null' : typeof item === 'object' ? '{...}' : String(item).slice(0, 50)}
              {typeof item !== 'object' && String(item).length > 50 && '...'}
            </summary>
            {renderValue(item)}
          </details>
        );
      })}
    </div>
  );
};

export default ObjectViewer;