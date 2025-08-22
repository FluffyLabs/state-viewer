import {useMemo} from 'react';
import { CompositeViewer, ToStringViewer } from '../viewer';
import { calculatePreimageHash } from './serviceUtils';

interface PreimageHashDisplayProps {
  value: unknown;
  rawValue?: string;
  showBytesLength?: boolean;
  variant?: 'normal' | 'before' | 'after';
}

const PreimageHashDisplay = ({
  value,
  rawValue,
  variant = 'normal'
}: PreimageHashDisplayProps) => {
  const colorClasses = {
    normal: {
      border: 'border-gray-200 dark:border-gray-600',
      text: 'text-gray-600 dark:text-gray-400'
    },
    before: {
      border: 'border-red-300 dark:border-red-600',
      text: 'text-red-700 dark:text-red-400'
    },
    after: {
      border: 'border-green-300 dark:border-green-600',
      text: 'text-green-700 dark:text-green-400'
    }
  };

  const colors = colorClasses[variant];
  const hash = useMemo(() => rawValue && calculatePreimageHash(rawValue), [rawValue]);

  return (
    <div>
      <CompositeViewer
        value={value}
        rawValue={rawValue}
        showBytesLength
      />
      {rawValue && (
        <div className={colors.border}>
          <ToStringViewer value={`Hash: ${hash}`} />
        </div>
      )}
    </div>
  );
};

export default PreimageHashDisplay;
