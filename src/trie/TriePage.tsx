import { Row } from "@/trie/components/ExamplesModal";
import { blake2bTrieHasher } from "@/trie/components/Trie/blake2b.node";
import Trie, { TreeNode } from "@/trie/components/Trie";
import { trieToTreeUI } from "@/trie/components/Trie/utils";
import { InMemoryTrie, BytesBlob, parseInputKey } from "@typeberry/trie";
import { useCallback, useMemo, useState } from "react";
import { NodeDetails } from "@/trie/components/NodeDetails";


const getTrie = (data: { key: string; value: string; }[]) => {
  const defaultTrie = InMemoryTrie.empty(blake2bTrieHasher);

  for (const { key, value } of data) {
    const stateKey = parseInputKey(key);
    const val = BytesBlob.parseBlobNoPrefix(value);
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

interface TriePageProps {
  rows: Row[];
}

export const TriePage = ({ rows }: TriePageProps) => {
  const [selectedNodeHash, setSelectedNodeHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState<boolean>(false);

  const trie = useMemo(() => {
    if (rows.length === 0) {
      return;
    }

    setError(null);
    try {
      return getTrie(rows);
    } catch (error: unknown) {
      if (error instanceof Error) {
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
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-row">
        <label className="flex font-mono text-xs gap-2 cursor-pointer">
          <input type="checkbox" onChange={(ev) => setHideEmpty(ev.target.checked)} />
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
        <NodeDetails node={selectedNode} onClose={closeNodeDetails} />
      )}
    </div>
  );
}
