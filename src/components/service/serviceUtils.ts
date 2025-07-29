import blake2b from "blake2b";
import type { Service, StorageKey, PreimageHash, U32 } from '../../types/service';
import { bytes } from '@typeberry/state-merkleization';

// Helper function to ensure serviceId is included in service info
export const getServiceInfoWithId = (service: Service | null, serviceId: number) => {
  if (!service) return null;
  const info = service.getInfo();
  return { ...info, serviceId };
};

export const parseStorageKey = (input: string): StorageKey => {
  if (input.startsWith('0x')) {
    if (input.length === 66) {
      return bytes.Bytes.parseBytes(input, 32);
    }
    if (input.length === 64) {
      return bytes.Bytes.parseBytes(input, 31);
    }
  }
  const hasher = blake2b(32);
  hasher.update(bytes.BytesBlob.blobFromString(input).raw);
  return bytes.Bytes.fromBlob(hasher.digest(), 32);
};

export const parsePreimageHash = (input: string): PreimageHash => {
  return bytes.Bytes.parseBytes(input, 32);
};

export const getStorageValue = (service: Service, key: string) => {
  try {
    const storageKey = parseStorageKey(key);
    return service.getStorage(storageKey);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
};

export const getPreimageValue = (service: Service, hash: string) => {
  try {
    const preimageHash = parsePreimageHash(hash);
    const hasPreimage = service.hasPreimage(preimageHash);
    if (!hasPreimage) {
      return null;
    }
    return service.getPreimage(preimageHash);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
};

export const getLookupHistoryValue = (service: Service, hash: string, length: string) => {
  try {
    const preimageHash = parsePreimageHash(hash);
    const len = parseInt(length, 10) as U32;
    if (isNaN(len)) {
      return 'Error: Invalid length';
    }
    return service.getLookupHistory(preimageHash, len);
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