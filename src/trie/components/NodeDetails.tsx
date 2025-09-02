import React from "react";
import { TreeNode } from "@/trie/components/Trie";
import { XIcon } from "lucide-react";
import { getNodeType, getNodeTypeColor } from "@/trie/components/Trie/utils";
import {InfoTooltip} from "@/components/InfoTooltip";

// Define the component props
interface NodeDetailsProps {
  node?: TreeNode;
  onClose: () => void;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node, onClose }) => {
  const displayValue = (value: string | undefined) => {
    return value ?? "";
  };

  return (
    <div className="p-4 border border-gray-300 rounded-md shadow-md w-full relative text-left font-mono text-xs">
      <button className="absolute top-2 right-2 cursor-pointer" onClick={onClose}>
        <XIcon className="h-5 w-5 hover:text-gray-700" />
      </button>
      <div className="mb-2 break-words">
        <span className="font-bold">Node Hash:</span>
        <span
          className="mx-2 p-1 px-2 rounded-xl capitalize"
          style={{ backgroundColor: node && getNodeTypeColor(node) }}
        >
          {node && getNodeType(node)}
        </span>
        {displayValue(node?.name)}
      </div>

      {node?.attributes?.nodeKey && (
        <div className="mb-2 break-words">
          <span className="font-bold">Key:</span> {displayValue(node.attributes.nodeKey)}
          <InfoTooltip entryKey={node.attributes.nodeKey} />
        </div>
      )}
      {node?.attributes?.value && (
        <div className="mb-2 break-words">
          <span className="font-bold">Value:</span> {displayValue(node?.attributes?.value)}
        </div>
      )}
      {node?.attributes?.valueHash && (
        <div className="mb-2 break-words">
          <span className="font-bold">Value Hash:</span> {displayValue(node?.attributes?.valueHash)}
        </div>
      )}
    </div>
  );
};
