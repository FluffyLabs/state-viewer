import * as codec from '@typeberry/lib/codec';
import * as state_vectors from '@typeberry/lib/state-vectors';
import { getChainSpec } from './chainSpecConfig';
/**
 * Binary file conversion utilities
 * Handles conversion from binary formats (.bin files) to parsed JSON objects
 */

/**
 * Converts a Uint8Array containing binary data to a parsed JSON object
 *
 * @param data - The raw binary data as Uint8Array
 * @returns A parsed object (equivalent to JSON.parse result)
 * @throws Error if conversion fails
 */
export const convertBinaryToJson = (data: Uint8Array): unknown => {
  // we are going to try all of the types
  try {
    const decoded = codec.Decoder.decodeObject(state_vectors.StateTransition.Codec, data, getChainSpec());
    return decoded;
  } catch (e) {
    console.warn(`Unable to decode as StateTransition: ${e}`);
  }

  try {
    const decoded = codec.Decoder.decodeObject(state_vectors.StateTransitionGenesis.Codec, data, getChainSpec());
    return decoded;
  } catch (e) {
    console.warn(`Unable to decode as StateTransitionGenesis: ${e}`);
  }

  throw new Error(`Couldn't decode the binary as any of the known types.`);
};
