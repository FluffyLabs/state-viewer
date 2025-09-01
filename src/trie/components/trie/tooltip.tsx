import {truncateString} from "./utils";

type Node = {
  label: string;
  value?: string;
  valueHash?: string;
  nodeKey?: string;
};

export const TooltipContent = ({ label, value, valueHash, nodeKey }: Node) => {
  return (
    <div className="font-mono">
      <div>
        <strong>Hash:</strong> {truncateString(label)}
      </div>
      {nodeKey && (
        <div>
          <strong>Truncated key:</strong> {truncateString(nodeKey)}
        </div>
      )}
      {value && (
        <div>
          <strong>Value:</strong> {truncateString(value)}
        </div>
      )}
      {valueHash && (
        <div>
          <strong>Value Hash:</strong> {truncateString(valueHash)}
        </div>
      )}
    </div>
  );
};
