import { Row } from "@/trie/components/ExamplesModal";
import { blake2bTrieHasher } from "@/trie/components/trie/blake2b.node";
import Trie from "@/trie/components/trie";
import { TreeNode, trieToTreeUI } from "@/trie/components/trie/utils";
import { trie, bytes } from "@typeberry/lib";
import { useCallback, useMemo, useState } from "react";
import { NodeDetails } from "@/trie/components/NodeDetails";
import {ServiceEntryType} from "@/components/service";

const { InMemoryTrie, parseInputKey } = trie;

const getTrie = (data: { key: string; value: string; }[]) => {
  const defaultTrie = InMemoryTrie.empty(blake2bTrieHasher);

  for (const { key, value } of data) {
    const stateKey = parseInputKey(key);
    const val = bytes.BytesBlob.parseBlobNoPrefix(value);
    defaultTrie.set(stateKey, val);
  }
  return defaultTrie;
};

const findNodeByHash = (data: TreeNode[], hash: string): TreeNode | undefined => {
  for (const item of data) {
    if (item.name === hash) {
      return item;
    }
    if (item.children) {
      const found = findNodeByHash(item.children, hash);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

interface TrieViewProps {
  rows: Row[];
  serviceData: Map<number, ServiceEntryType[]>;
}

export const TrieView = ({ rows, serviceData }: TrieViewProps) => {
  const [selectedNodeHash, setSelectedNodeHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState<boolean>(true);

  const trie = useMemo(() => {
    if (rows.length === 0) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-render
    setError(null);
    try {
      return getTrie(rows);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // eslint-disable-next-line react-hooks/set-state-in-render
        setError(error.message);
      }
      return null;
    }
  }, [rows]);

  const uiTrie = useMemo(() => {
    if (!trie) {
      return null;
    }
    return trieToTreeUI(trie.getRootNode(), trie.getRootHash(), trie.nodes, hideEmpty);
  }, [trie, hideEmpty]);

  const onNodeSelect = useCallback((node: string) => {
    setSelectedNodeHash(node);
  }, []);

  const closeNodeDetails = useCallback(() => {
    setSelectedNodeHash(null);
  }, [setSelectedNodeHash]);

  const selectedNode = useMemo(() => {
    return selectedNodeHash && uiTrie && findNodeByHash([uiTrie], selectedNodeHash);
  }, [uiTrie, selectedNodeHash]);

  return (
    <>
      <div className="flex flex-row">
        <label className="flex font-mono text-xs gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideEmpty}
            onChange={(ev) => setHideEmpty(ev.target.checked)}
          />
          Hide empty nodes
        </label>
      </div>
      <div className="flex-1 overflow-hidden">
        { uiTrie ? (
          <Trie treeData={uiTrie} onNodeSelect={onNodeSelect} />
        ) : (
          <span className="color-destructive">Error: {error}</span>
        )}
      </div>
      {selectedNode && (
        <NodeDetails
          node={selectedNode}
          serviceData={serviceData}
          onClose={closeNodeDetails}
        />
      )}
    </>
  );
}
