import { trie } from "@typeberry/state-merkleization";
const { NodeType } = trie;

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  attributes: {
    prefix?: string;
    nodeKey?: string;
    value?: string;
    valueLength?: number;
    valueHash?: string;
  };
}

export const HASH_BYTES = 32;

export const truncateString = (str: string, maxLength: number = 20) =>
  str.length >= maxLength ? str.substring(0, 6) + "..." + str.substring(str.length - 6) : str;

const shouldRenderNode = (node: trie.TrieNodeHash, hideEmpty: boolean) => {
  return hideEmpty ? !isEmptyHash(node) : true;
};

export function isEmptyHash(node: trie.TrieNodeHash) {
  return isEmptyNodeName(node.toString());
}

export function isEmptyNodeName(name: string) {
  return name === "0x0000000000000000000000000000000000000000000000000000000000000000";
}
export function trieToTreeUI(
  root: trie.TrieNode | null,
  hash: trie.TrieNodeHash,
  nodes: trie.WriteableNodesDb,
  hideEmpty: boolean,
  prefix: string = "",
): TreeNode | undefined {
  if (isEmptyHash(hash)) {
    return {
      name: "0x0000000000000000000000000000000000000000000000000000000000000000",
      attributes: {
        prefix,
      },
    };
  }

  if (root === null) {
    return undefined;
  }

  const kind = root.getNodeType();
  if (kind === NodeType.Branch) {
    const branch = root.asBranchNode();
    const leftHash = branch.getLeft();
    const rightHash = branch.getRight();

    const left = trieToTreeUI(nodes.get(leftHash), leftHash, nodes, hideEmpty, prefix + "0");
    const right = trieToTreeUI(nodes.get(rightHash), rightHash, nodes, hideEmpty, prefix + "1");

    return {
      name: hash.toString(),
      attributes: {
        prefix,
      },
      children: [
        shouldRenderNode(leftHash, hideEmpty) ? left : null,
        shouldRenderNode(rightHash, hideEmpty) ? right : null,
      ].filter((x) => x) as TreeNode[],
    };
  }

  const leaf = root.asLeafNode();
  const valueLength = leaf.getValueLength();

  return {
    name: hash.toString(),
    attributes: {
      nodeKey: leaf.getKey().toString(),
      prefix,
      ...(valueLength > 0 ? { value: `${leaf.getValue()}`, valueLength } : { valueHash: `${leaf.getValueHash()}` }),
    },
  };
}

export const getNodeTypeColor = (node: TreeNode) => {
  if (getNodeType(node) === "Leaf") {
    return "#00bcd4";
  }
  if (node?.name === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return "#c9c9c9";
  }
  return "#55b3f3";
};

export const getNodeType = (node: TreeNode) => {
  return node?.attributes?.value || node?.attributes?.valueHash ? "Leaf" : "Branch";
};

export const trimEdgePrefix = (prefix: string) => {
  if (prefix.length <= 4) {
    return `0b${prefix}`;
  }

  const hexPartLength = Math.floor((prefix.length - 1) / 4);
  const hexLengthAsBinary = hexPartLength * 4;

  const hexPart = parseInt(prefix.slice(0, hexLengthAsBinary), 2).toString(16).padStart(hexPartLength, "0");
  const binaryPart = prefix.slice(hexLengthAsBinary);

  return `0x${hexPart} ++ b${binaryPart}`;
}
