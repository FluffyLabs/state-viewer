import blake2b from "blake2b";
import { Bytes, TrieNodeHash, TrieHasher } from "@typeberry/trie";
import { HASH_BYTES } from "./utils";

export const blake2bTrieHasher: TrieHasher = {
  hashConcat(n: Uint8Array, rest?: Uint8Array[]): TrieNodeHash {
    const hasher = blake2b(HASH_BYTES);
    hasher?.update(n);
    for (const v of rest ?? []) {
      hasher?.update(v);
    }
    const out = Bytes.zero(HASH_BYTES);
    hasher?.digest(out.raw);
    return out as TrieNodeHash;
  },
};
