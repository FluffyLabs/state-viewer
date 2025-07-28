import { toSmartString } from "./utils";

interface ToStringViewerProps {
  value: unknown;
}

const ToStringViewer = ({ value }: ToStringViewerProps) => {
  return (
    <pre className="mt-1 pl-2 text-xs font-mono bg-gray-50 rounded p-2 break-all overflow-auto">
      {value === null ? <span className="text-gray-500 italic">null</span> : toSmartString(value)}
    </pre>
  );
};

export default ToStringViewer;
