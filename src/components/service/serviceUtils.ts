import blake2b from "blake2b";
import type { Service, StorageKey, PreimageHash, U32 } from '../../types/service';
import { bytes, StateKey } from '@typeberry/state-merkleization';
import {RawState} from "./types";

// Helper function to ensure serviceId is included in service info
export const getServiceInfoWithId = (service: Service | null, serviceId: number) => {
  if (!service) return null;
  const info = service.getInfo();
  return { ...info, serviceId };
};

export const parseStorageKey = (input: string): {
  type: 'storage', key: StorageKey } | { type: 'raw', key: StateKey } => {
  if (input.startsWith('0x')) {
    if (input.length === 66) {
      return { type: 'storage', key: bytes.Bytes.parseBytes(input, 32) }
    }
    if (input.length === 64) {
      return { type: 'raw', key: bytes.Bytes.parseBytes(input, 31).asOpaque() };
    }
    if (input.length === 48) {
      const paddedInput = input + '0'.repeat(18);
      return { type: 'storage', key: bytes.Bytes.parseBytes(paddedInput, 32) };
    }
  }
  const hasher = blake2b(32);
  hasher.update(bytes.BytesBlob.blobFromString(input).raw);
  return { type: 'storage', key: bytes.Bytes.fromBlob(hasher.digest(), 32) };
};

export const parsePreimageInput = (input: string): { type: 'preimage', hash: PreimageHash } | { type: 'raw', key: StateKey } => {
  if (input.startsWith('0x') && input.length === 64) {
    return { type: 'raw', key: bytes.Bytes.parseBytes(input, 31).asOpaque() };
  }

  return { type: 'preimage', hash: bytes.Bytes.parseBytes(input, 32) };
};

export const getStorageValue = (service: Service, key: string, rawState: RawState) => {
  try {
    const storageKey = parseStorageKey(key);
    if (storageKey.type === 'storage') {
      return service.getStorage(storageKey.key);
    }
    const rawValue = rawState[storageKey.key.toString()];
      return (rawValue === undefined) ? null : bytes.BytesBlob.parseBlob(rawValue);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
};

export const getPreimageValue = (service: Service, hash: string, rawState: RawState) => {
  try {
    const parsed = parsePreimageInput(hash);
    if (parsed.type === 'raw') {
      const rawValue = rawState[parsed.key.toString()];
      return (rawValue === undefined) ? null : bytes.BytesBlob.parseBlob(rawValue);
    } else {
      const hasPreimage = service.hasPreimage(parsed.hash);
      if (!hasPreimage) {
        return null;
      }
      return service.getPreimage(parsed.hash);
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
};

export const getLookupHistoryValue = (service: Service, hash: string, length: string, rawState: RawState) => {
  try {
    const parsed = parsePreimageInput(hash);
    if (parsed.type === 'raw') {
      const rawValue = rawState[parsed.key.toString()];
      return (rawValue === undefined) ? null : bytes.BytesBlob.parseBlob(rawValue);
    }
    const len = parseInt(length, 10) as U32;
    if (isNaN(len)) {
      return 'Error: Invalid length';
    }
    return service.getLookupHistory(parsed.hash, len);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
};

export const calculatePreimageHash = (rawValue: string): string => {
  try {
    const blob = bytes.BytesBlob.parseBlob(rawValue);
    const hasher = blake2b(32);
    hasher.update(blob.raw);
    return bytes.BytesBlob.blobFrom(hasher.digest()).toString();
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
};

export const parseServiceIds = (input: string): number[] => {
  return input
    .split(',')
    .map(id => id.trim())
    .filter(id => id !== '')
    .map(id => parseInt(id, 10))
    .filter(id => !isNaN(id));
};

export const extractServiceIdsFromState = (state: Record<string, string>): number[] => {
  const serviceIds = new Set<number>();

  for (const key of Object.keys(state)) {
    if (key.startsWith('0xff') && key.length >= 10) {
      try {
        const hexPart = key.slice(4);

        const serviceIdBytes: number[] = [];
        for (let i = 0; i < hexPart.length && serviceIdBytes.length < 4; i += 4) {
          const hexByte = hexPart.slice(i, i + 2);
          const zeroByte = hexPart.slice(i + 2, i + 4);

          if (zeroByte === '00' || i + 2 >= hexPart.length) {
            serviceIdBytes.push(parseInt(hexByte, 16));
          } else {
            break;
          }
        }

        if (serviceIdBytes.length === 4) {
          const serviceId = serviceIdBytes[0] |
                           (serviceIdBytes[1] << 8) |
                           (serviceIdBytes[2] << 16) |
                           (serviceIdBytes[3] << 24);
          serviceIds.add(serviceId);
        }
      } catch {
        continue;
      }
    }
  }

  return Array.from(serviceIds).sort((a, b) => a - b);
};
export const getServiceIdBytesLE = (serviceId: number): [string, string, string, string] => {
  const b0 = (serviceId & 0xff).toString(16).padStart(2, '0');
  const b1 = ((serviceId >>> 8) & 0xff).toString(16).padStart(2, '0');
  const b2 = ((serviceId >>> 16) & 0xff).toString(16).padStart(2, '0');
  const b3 = ((serviceId >>> 24) & 0xff).toString(16).padStart(2, '0');
  return [b0, b1, b2, b3];
};

export const discoverStorageKeysForService = (state: Record<string, string>, serviceId: number): string[] => {
  const [b0, b1, b2, b3] = getServiceIdBytesLE(serviceId);
  const prefix = `0x${b0}ff${b1}ff${b2}ff${b3}ff`;
  const results: string[] = [];
  for (const key of Object.keys(state)) {
    if (key.startsWith(prefix)) {
      results.push(key);
    }
  }
  return results;
};

export const discoverPreimageKeysForService = (state: Record<string, string>, serviceId: number): string[] => {
  const [b0, b1, b2, b3] = getServiceIdBytesLE(serviceId);
  const prefix = `0x${b0}fe${b1}ff${b2}ff${b3}ff`;
  const results: string[] = [];
  for (const key of Object.keys(state)) {
    if (key.startsWith(prefix)) {
      results.push(key);
    }
  }
  return results;
};

export const discoverLookupHistoryKeysForService = (state: Record<string, string>, serviceId: number): string[] => {
  const [b0, b1, b2, b3] = getServiceIdBytesLE(serviceId);
  const storagePrefix = `0x${b0}ff${b1}ff${b2}ff${b3}ff`;
  const preimagePrefix = `0x${b0}fe${b1}ff${b2}ff${b3}ff`;
  const results: string[] = [];
  for (const key of Object.keys(state)) {
    if (!key.startsWith('0x') || key.length < 2 + 16) {
      continue;
    }
    if (key.startsWith(storagePrefix) || key.startsWith(preimagePrefix)) {
      continue;
    }
    const hex = key.slice(2);
    const match =
      hex.slice(0, 2) === b0 &&
      hex.length >= 16 &&
      hex.slice(4, 6) === b1 &&
      hex.slice(8, 10) === b2 &&
      hex.slice(12, 14) === b3;
    if (match) {
      results.push(key);
    }
  }
  return results;
};


export const getServiceChangeType = (serviceData: import('./types').ServiceData): 'added' | 'removed' | 'changed' | 'normal' => {
  const { preService, postService, preError, postError } = serviceData;

  if (preError && postError) return 'normal';

  if (!preService && postService) return 'added';

  if (preService && !postService) return 'removed';

  if (preService && postService) {
    try {
      const preInfo = JSON.stringify(preService.getInfo());
      const postInfo = JSON.stringify(postService.getInfo());
      return preInfo !== postInfo ? 'changed' : 'normal';
    } catch {
      return 'normal';
    }
  }

  return 'normal';
};

export const getComprehensiveServiceChangeType = (
  serviceData: import('./types').ServiceData,
  state: Record<string, string>,
  preState?: Record<string, string>
): {
  hasAnyChanges: boolean;
  hasServiceInfoChanges: boolean;
  hasStorageChanges: boolean;
  hasPreimageChanges: boolean;
  hasLookupHistoryChanges: boolean;
} => {
  const { serviceId } = serviceData;
  const serviceInfoChangeType = getServiceChangeType(serviceData);
  const hasServiceInfoChanges = serviceInfoChangeType !== 'normal';
  
  if (!preState) {
    return {
      hasAnyChanges: hasServiceInfoChanges,
      hasServiceInfoChanges,
      hasStorageChanges: false,
      hasPreimageChanges: false,
      hasLookupHistoryChanges: false,
    };
  }
  
  const calc = (discoverFn: (s: Record<string, string>, id: number) => string[]) => {
    const post = discoverFn(state, serviceId);
    const pre = discoverFn(preState, serviceId);
    const preSet = new Set(pre);
    const postSet = new Set(post);
    const total = Array.from(new Set([...pre, ...post]));
    const changed = total.filter((k) => preSet.has(k) && postSet.has(k) && preState[k] !== state[k]);
    const added = post.filter((k) => !preSet.has(k));
    const removed = pre.filter((k) => !postSet.has(k));
    return added.length > 0 || removed.length > 0 || changed.length > 0;
  };
  
  const hasStorageChanges = calc(discoverStorageKeysForService);
  const hasPreimageChanges = calc(discoverPreimageKeysForService);
  const hasLookupHistoryChanges = calc(discoverLookupHistoryKeysForService);
  
  const hasAnyChanges = hasServiceInfoChanges || hasStorageChanges || hasPreimageChanges || hasLookupHistoryChanges;
  
  return {
    hasAnyChanges,
    hasServiceInfoChanges,
    hasStorageChanges,
    hasPreimageChanges,
    hasLookupHistoryChanges,
  };
};
