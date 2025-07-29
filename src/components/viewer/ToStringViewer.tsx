import { toSmartString } from "./utils";

interface ToStringViewerProps {
  value: unknown;
}

const ToStringViewer = ({ value }: ToStringViewerProps) => {
  return (
    <pre className="mt-1 pl-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 rounded p-2 break-all overflow-auto" data-testid="tostring-viewer">
      {value === null ? <span className="text-gray-500 dark:text-gray-400 italic">null</span> : toSmartString(value, true)}
    </pre>
  );
};

export default ToStringViewer;
