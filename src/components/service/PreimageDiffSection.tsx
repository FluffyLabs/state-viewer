import PreimageHashDisplay from './PreimageHashDisplay';

interface PreimageDiffSectionProps {
  title: string;
  value: unknown;
  rawValue?: string;
  variant: 'before' | 'after';
  showBytesLength?: boolean;
}

const PreimageDiffSection = ({
  title,
  value,
  rawValue,
  variant,
}: PreimageDiffSectionProps) => {
  const styleClasses = {
    before: {
      titleText: 'text-red-700 dark:text-red-400',
      background: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700'
    },
    after: {
      titleText: 'text-green-700 dark:text-green-400',
      background: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700'
    }
  };

  const styles = styleClasses[variant];

  if (!rawValue) return null;

  return (
    <div>
      <div className={`text-xs font-medium ${styles.titleText} mb-1`}>
        {title}
      </div>
      <div className={`${styles.background} border ${styles.border} p-2 rounded text-xs`}>
        <PreimageHashDisplay
          value={value}
          rawValue={rawValue}
          variant={variant}
        />
      </div>
    </div>
  );
};

export default PreimageDiffSection;
