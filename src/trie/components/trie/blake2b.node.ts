import blake2b from "blake2b";
import { trie, bytes } from "@typeberry/state-merkleization";
import { HASH_BYTES } from "./utils";

export const blake2bTrieHasher: trie.TrieHasher = {
  hashConcat(n: Uint8Array, rest?: Uint8Array[]): trie.TrieNodeHash {
    const hasher = blake2b(HASH_BYTES);
    hasher?.update(n);
    for (const v of rest ?? []) {
      hasher?.update(v);
    }
    const out = bytes.Bytes.zero(HASH_BYTES);
    hasher?.digest(out.raw);
    return out as trie.TrieNodeHash;
  },
};
