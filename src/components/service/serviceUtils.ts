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
    if (input.length === 50) {
      const paddedInput = input + '0'.repeat(16);
      return bytes.Bytes.parseBytes(paddedInput, 32);
    }
  }
  const hasher = blake2b(32);
  hasher.update(bytes.BytesBlob.blobFromString(input).raw);
  return bytes.Bytes.fromBlob(hasher.digest(), 32);
};

export const parsePreimageHash = (input: string): PreimageHash => {
  if (input.startsWith('0x') && input.length === 50) {
    const paddedInput = input + '0'.repeat(16);
    return bytes.Bytes.parseBytes(paddedInput, 32);
  }
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
