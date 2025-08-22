import { CompositeViewer } from '../viewer';

interface ValueDisplayProps {
  value: unknown;
  rawValue?: string;
  showBytesLength?: boolean;
  showModeToggle?: boolean;
  variant?: 'normal' | 'before' | 'after';
}

const ValueDisplay = ({ 
  value, 
  rawValue, 
  showBytesLength = false,
  showModeToggle = false,
  variant = 'normal' 
}: ValueDisplayProps) => {
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

  return (
    <div className={colors.border}>
      <CompositeViewer
        value={value}
        rawValue={rawValue}
        showBytesLength={showBytesLength}
        showModeToggle={showModeToggle}
      />
    </div>
  );
};

export default ValueDisplay;