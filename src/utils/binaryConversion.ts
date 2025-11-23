import { codec, state_vectors } from '@typeberry/lib';
import { getChainSpec } from './chainSpecConfig';
/**
 * Binary file conversion utilities
 * Handles conversion from binary formats (.bin files) to parsed JSON objects
 */

const supportedTypes = [
  state_vectors.StateTransition,
  state_vectors.StateTransitionGenesis,
];

/**
 * Converts a Uint8Array containing binary data to a parsed JSON object
 *
 * @param data - The raw binary data as Uint8Array
 * @returns A parsed object (equivalent to JSON.parse result)
 * @throws Error if conversion fails
 */
export const convertBinaryToJson = (data: Uint8Array): unknown => {
  // we are going to try all of the types
  for (const typ of supportedTypes) {
    try {
      const decoded = codec.Decoder.decodeObject(typ.Codec, data, getChainSpec());
      return decoded;
    } catch (e) {
      console.warn(`Unable to decode as ${typ.name}: ${e}`);
    }
  }
  throw new Error(`Couldn't decode the binary as any of the known types.`);
};
