import blake2b from "blake2b";
import type { Service, StorageKey, PreimageHash, U32 } from '../../types/service';
import { bytes, numbers, state_merkleization, hash } from '@typeberry/lib';
import { ServiceData} from "./types";
import { serviceData as serviceDataSerializer } from '../../constants/serviceFields';
import {RawState} from "@/types/shared";

const hashBytes = (b: bytes.BytesBlob): bytes.Bytes<32> => {
  const hasher = blake2b(32);
  hasher.update(b.raw);
  return bytes.Bytes.fromBlob(hasher.digest(), 32);
};

const libBlake2b = await hash.Blake2b.createHasher();

// Helper function to ensure serviceId is included in service info
export const getServiceInfoWithId = (service: Service | null, serviceId: number) => {
  if (!service) return null;
  const info = service.getInfo();
  return { ...info, serviceId };
};

export const parseStorageKey = (input: string): {
  type: 'storage', key: StorageKey } | { type: 'raw', key: state_merkleization.StateKey } => {
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
  
  const hash = hashBytes(bytes.BytesBlob.blobFromString(input));
  return { type: 'storage', key: hash };
};

export const parsePreimageInput = (input: string): { type: 'preimage', hash: PreimageHash } | { type: 'raw', key: state_merkleization.StateKey } => {
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
    return hashBytes(bytes.BytesBlob.parseBlob(rawValue)).toString();
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
};

export const formatServiceIdUnsigned = (serviceId: number): string => {
  const bn = BigInt(serviceId);
  return bn >= 0n ? bn.toString() : (2n ** 32n + bn).toString();
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
  const serviceIds = new Set(Object.keys(state)
    .map(key => detectServiceId(key))
    .filter(v => v !== null));

    return Array.from(serviceIds).sort((a, b) => a - b);
};

export const getServiceIdBytesLE = (serviceId: number): [string, string, string, string] => {
  const b0 = (serviceId & 0xff).toString(16).padStart(2, '0');
  const b1 = ((serviceId >>> 8) & 0xff).toString(16).padStart(2, '0');
  const b2 = ((serviceId >>> 16) & 0xff).toString(16).padStart(2, '0');
  const b3 = ((serviceId >>> 24) & 0xff).toString(16).padStart(2, '0');
  return [b0, b1, b2, b3];
};

export type ServiceEntryType = {
  kind: 'service-info',
  key: string,
  value: string,
} | {
  kind: 'preimage',
  key: string,
  value: string,
  length: number,
  hash: bytes.Bytes<32>,
} | {
  kind: 'storage-or-lookup',
  key: string,
  value: string,
} | {
  kind: 'lookup',
  key: string,
  value: string,
};

function detectServiceEntryType(serviceId: number, key: string, value: string): ServiceEntryType | null {
    if (isServiceInfoKey(serviceId, key)) {
      return {
        kind: 'service-info',
        key,
        value,
      };
    }

    if (!isForServiceButNotInfo(serviceId, key)) {
      return null;
    }

    const data = bytes.BytesBlob.parseBlob(value);
    const hash = hashBytes(data);
    const computedKey = state_merkleization.stateKeys.servicePreimage(
      libBlake2b,
      serviceId as never,
      hash.asOpaque()
    ).toString();

    if (computedKey.startsWith(key)) {
      return {
        kind: 'preimage',
        key,
        value,
        length: data.length,
        hash,
      }
    }

    return {
      kind: 'storage-or-lookup',
      key,
      value,
    };
}

export const cache = new Map<RawState, Map<number, ServiceEntryType[]>>();

export const discoverServiceEntries = (state: RawState, serviceId: number): ServiceEntryType[] => {
  // check cached entries
  const cachedState = cache.get(state) ?? new Map();
  cache.set(state, cachedState);
  const serviceEntities = cachedState.get(serviceId);
  if (serviceEntities !== undefined) {
    return serviceEntities;
  }

  // detect service info & preimages
  const initialEntries = Object.entries(state)
    .map(([key, value]) => detectServiceEntryType(serviceId, key, value))
    .filter(v => v !== null);

  const detectedLookups = new Set<string>();
  const allEntries: ServiceEntryType[] = [];

  // now, given we have all preimages we can compute lookup history items
  for (const val of initialEntries) {
    allEntries.push(val);

    if (val.kind === 'preimage') {
      const serviceLookupKey = state_merkleization.stateKeys.serviceLookupHistory(
        libBlake2b,
        serviceId as never,
        val.hash.asOpaque(),
        numbers.tryAsU32(val.length)
      ).toString().substring(0, 64);

      detectedLookups.add(serviceLookupKey);
      allEntries.push({
        kind: 'lookup',
        key: serviceLookupKey,
        value: state[serviceLookupKey] ?? '',
      });
    }
  }

  // filter out storage-or-lookups that are now duplicated
  const foundEntries = allEntries.filter(v => {
    if (v.kind === 'storage-or-lookup' && detectedLookups.has(v.key)) {
      return false;
    }
    return true;
  });
  cachedState.set(serviceId, foundEntries);
  return foundEntries;
}

export const getServiceChangeType = (serviceData: ServiceData): 'added' | 'removed' | 'changed' | 'normal' => {
  const { preService, postService, preError, postError } = serviceData;

  if (preError && postError) return 'normal';

  if (!preService && postService) return 'added';

  if (preService && !postService) return 'removed';

  if (preService && postService) {
    try {
      const preInfo = preService.getInfo();
      const postInfo = postService.getInfo();

      const preInfoStr = `${preInfo}`;
      const postInfoStr = `${postInfo}`;
      return preInfoStr !== postInfoStr ? 'changed' : 'normal';
    } catch {
      return 'normal';
    }
  }

  return 'normal';
};

export type ChangeSet = {
  hasAnyChanges: boolean;
  totalCount: number;
  preCount: number;
  postCount: number;
  added: number;
  removed:number;
  changed: number;
};

export const getComprehensiveServiceChangeType = (
  serviceData: ServiceData,
  state: Record<string, string>,
  preState?: Record<string, string>
): {
  hasAnyChanges: boolean;
  hasServiceInfoChanges: boolean;
  storage: ChangeSet;
  preimages: ChangeSet;
  lookup: ChangeSet;
} => {
  const { serviceId } = serviceData;
  const serviceInfoChangeType = getServiceChangeType(serviceData);
  const hasServiceInfoChanges = serviceInfoChangeType !== 'normal';

  const compareWith = preState ? preState : state;
  const calc = (discoverFn: (s: Record<string, string>, id: number) => string[]) => {
    const post = discoverFn(state, serviceId);
    const pre = discoverFn(compareWith, serviceId);
    const preSet = new Set(pre);
    const postSet = new Set(post);
    const total = Array.from(new Set([...pre, ...post]));
    const changed = total.filter((k) => preSet.has(k) && postSet.has(k) && compareWith[k] !== state[k]);
    const added = post.filter((k) => !preSet.has(k));
    const removed = pre.filter((k) => !postSet.has(k));
    const hasAnyChanges = added.length > 0 || removed.length > 0 || changed.length > 0;

    return {
      hasAnyChanges,
      totalCount: total.length,
      preCount: pre.length,
      postCount: post.length,
      added: added.length,
      removed: removed.length,
      changed: changed.length
    };
  };

  const postEntries = discoverServiceEntries(state, serviceId);
  const preEntries = discoverServiceEntries(compareWith, serviceId);

  const storage = calc((s) => {
    const entries = s === state ? postEntries : preEntries;
    return entries
    .filter(v => v.kind === 'storage-or-lookup')
    .map(v => v.key);
  });
  const preimages = calc((s) => {
    const entries = s === state ? postEntries : preEntries;
    return entries
    .filter(v => v.kind === 'preimage')
    .map(v => v.key);
  });
  const lookupHistory = calc((s) => {
    const entries = s === state ? postEntries : preEntries;
    return entries
    .filter(v => v.kind === 'lookup')
    .map(v => v.key);
  });

  const hasAnyChanges = storage.hasAnyChanges || preimages.hasAnyChanges || lookupHistory.hasAnyChanges || hasServiceInfoChanges;
  return {
    hasAnyChanges,
    hasServiceInfoChanges,
    storage,
    preimages,
    lookup: lookupHistory,
  };
}

function isServiceInfoKey(serviceId: number, key: string): boolean {
  const expectedKey = state_merkleization.stateKeys.serviceInfo(serviceId as never);
  return expectedKey.toString().startsWith(key);
}

function isForServiceButNotInfo(serviceId: number, key: string) {
  const [b0, b1, b2, b3] = getServiceIdBytesLE(serviceId);
  const hex = key.slice(2);
  const match = 
    hex.length >= 16 &&
    hex.slice(0, 2) === b0 &&
    hex.slice(4, 6) === b1 &&
    hex.slice(8, 10) === b2 &&
    hex.slice(12, 14) === b3;
  return match;
}

export function detectServiceId(key: string): number | null {
  if (!key.startsWith('0x') || key.length < 10) {
    return null;
  }

  const hex = key.slice(2);

  if (key.startsWith('0xff') && hex.length >= 8) {
    try {
      const serviceIdBytes = [
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(6, 8), 16),
        parseInt(hex.slice(10, 12), 16),
        parseInt(hex.slice(14, 16), 16)
      ];
      return serviceIdBytes[0] | (serviceIdBytes[1] << 8) | (serviceIdBytes[2] << 16) | (serviceIdBytes[3] << 24);
    } catch {
      return null;
    }
  }

  try {
    const serviceIdBytes = [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(4, 6), 16),
      parseInt(hex.slice(8, 10), 16),
      parseInt(hex.slice(12, 14), 16)
    ];
    return serviceIdBytes[0] | (serviceIdBytes[1] << 8) | (serviceIdBytes[2] << 16) | (serviceIdBytes[3] << 24);
  } catch {
    return null;
  }
};

export const serviceMatchesSearch = (
  serviceData: ServiceData,
  searchTerm: string,
  state: Record<string, string>,
  preState?: Record<string, string>
): boolean => {
  if (!searchTerm.trim()) return true;

  const { serviceId, preService, postService } = serviceData;
  const searchLower = searchTerm.toLowerCase();

  const formattedId = formatServiceIdUnsigned(serviceId);
  if (formattedId.includes(searchLower) || serviceId.toString().includes(searchLower)) {
    return true;
  }

  // Search by service raw key
  try {
    const rawKey = serviceDataSerializer(serviceId as never).key.toString().substring(0, 64);
    if (rawKey.toLowerCase().includes(searchLower)) {
      return true;
    }
  } catch {
    // Ignore service raw key errors for search (important-comment)
  }

  // Search by service info with enhanced field handling
  const activeService = postService || preService;
  if (activeService) {
    try {
      const info = activeService.getInfo();

      // Search individual fields for better matching
      if (info.balance !== undefined && info.balance.toString().toLowerCase().includes(searchLower)) {
        return true;
      }

      if (info.nonce !== undefined && info.nonce.toString().toLowerCase().includes(searchLower)) {
        return true;
      }

      if (info.codeHash && info.codeHash instanceof Uint8Array) {
        const codeHashHex = Array.from(info.codeHash)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
        if (codeHashHex.toLowerCase().includes(searchLower)) {
          return true;
        }
        if (('0x' + codeHashHex).toLowerCase().includes(searchLower)) {
          return true;
        }
      }

      // Search other fields in service info
      for (const [key, value] of Object.entries(info)) {
        if (key === 'codeHash') continue; // Already handled above
        if (value !== undefined && value !== null) {
          const valueStr = value.toString().toLowerCase();
          if (valueStr.includes(searchLower)) {
            return true;
          }
        }
      }

      const infoStr = JSON.stringify(info).toLowerCase();
      if (infoStr.includes(searchLower)) {
        return true;
      }
    } catch {
      // Ignore service info errors for search
    }
  }

  const allPostKeys = discoverServiceEntries(state, serviceId).map(v => v.key)
  const allPreKeys  = preState ? discoverServiceEntries(preState, serviceId).map(v => v.key) : [];
  const allKeys = Array.from(new Set([...allPreKeys, ...allPostKeys]));

  for (const key of allKeys) {
    if (key.toLowerCase().includes(searchLower)) return true;
    const value = state[key] || (preState && preState[key]);
    if (value && value.toLowerCase().includes(searchLower)) return true;
  }

  return false;
};
