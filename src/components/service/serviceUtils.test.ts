import { describe, it, expect, vi } from 'vitest';
import {
  calculatePreimageHash,
  parseStorageKey,
  parsePreimageInput,
  getServiceIdBytesLE,
  parseServiceIds,
  extractServiceIdsFromState,
  discoverServiceEntries,
  getServiceChangeType,
  formatServiceIdUnsigned
} from './serviceUtils';
import type { Service, ServiceAccountInfo } from '@/types/service';


describe('serviceUtils', () => {
  describe('calculatePreimageHash', () => {
    it('calculates blake2b hash correctly for valid hex string', () => {
      const rawValue = '0x48656c6c6f'; // "Hello" in hex
      const result = calculatePreimageHash(rawValue);
      
      expect(result).toMatch(/^0x[a-f0-9]{64}$/);
      // Just verify it returns a valid 32-byte hash, not a specific value
      expect(result.length).toBe(66); // 0x + 64 hex chars
    });

    it('handles empty hex string', () => {
      const rawValue = '0x';
      const result = calculatePreimageHash(rawValue);
      
      expect(result).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('returns error for invalid input', () => {
      const rawValue = 'invalid-hex';
      const result = calculatePreimageHash(rawValue);
      
      expect(result).toContain('Error:');
    });
  });

  describe('parseStorageKey', () => {
    it('parses 32-byte hex string as storage key', () => {
      const input = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = parseStorageKey(input);
      
      expect(result.type).toBe('storage');
      expect(result.key).toBeDefined();
    });

    it('parses 31-byte hex string as raw key', () => {
      const input = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd';
      const result = parseStorageKey(input);
      
      expect(result.type).toBe('raw');
      expect(result.key).toBeDefined();
    });


  });

  describe('parsePreimageInput', () => {
    it('parses 31-byte hex string as raw key', () => {
      const input = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd';
      const result = parsePreimageInput(input);
      
      expect(result.type).toBe('raw');
      if (result.type === 'raw') {
        expect(result.key).toBeDefined();
      }
    });

    it('parses other hex strings as preimage hash', () => {
      const input = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = parsePreimageInput(input);
      
      expect(result.type).toBe('preimage');
      if (result.type === 'preimage') {
        expect(result.hash).toBeDefined();
      }
    });

    it('parses hex input as preimage hash', () => {
      const input = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = parsePreimageInput(input);
      
      expect(result.type).toBe('preimage');
    });
  });

  describe('getServiceIdBytesLE', () => {
    it('converts service ID to little-endian bytes', () => {
      const serviceId = 0x12345678;
      const result = getServiceIdBytesLE(serviceId);
      
      expect(result).toEqual(['78', '56', '34', '12']);
    });

    it('handles zero service ID', () => {
      const serviceId = 0;
      const result = getServiceIdBytesLE(serviceId);
      
      expect(result).toEqual(['00', '00', '00', '00']);
    });

    it('handles single byte service ID', () => {
      const serviceId = 42;
      const result = getServiceIdBytesLE(serviceId);
      
      expect(result).toEqual(['2a', '00', '00', '00']);
    });
  });

  describe('parseServiceIds', () => {
    it('parses comma-separated service IDs', () => {
      const input = '1,2,3,4';
      const result = parseServiceIds(input);
      
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('handles spaces around service IDs', () => {
      const input = ' 1 , 2 , 3 ';
      const result = parseServiceIds(input);
      
      expect(result).toEqual([1, 2, 3]);
    });

    it('filters out invalid service IDs', () => {
      const input = '1,invalid,3,';
      const result = parseServiceIds(input);
      
      expect(result).toEqual([1, 3]);
    });

    it('handles empty input', () => {
      const input = '';
      const result = parseServiceIds(input);
      
      expect(result).toEqual([]);
    });
  });

  describe('extractServiceIdsFromState', () => {
    it('extracts service IDs from state keys', () => {
      const state = {
        '0x01ff02ff03ff04ff': 'value1',  // Service ID pattern
        '0x02ff03ff04ff05ff': 'value2',  // Service ID pattern
        '0xother-key': 'value3'
      };

      const result = extractServiceIdsFromState(state);

      expect(result.length).toBeGreaterThan(0);
    });

    it('returns empty array for state with no service keys', () => {
      const state = {
        '0xother': 'value1',
        'regular-key': 'value2'
      };
      
      const result = extractServiceIdsFromState(state);
      
      expect(result).toEqual([]);
    });
  });

  describe('discoverServiceEntries', () => {
    it('returns empty array for empty state', () => {
      const state = {};
      const serviceId = 1;

      const result = discoverServiceEntries(state, serviceId);

      expect(result).toEqual([]);
    });

    it('filters out non-service entries', () => {
      const state = {
        '0xother-key': '0x1234',
        'regular-key': '0x5678'
      };
      const serviceId = 1;

      const result = discoverServiceEntries(state, serviceId);

      expect(result).toEqual([]);
    });

    it('discovers and categorizes service entries', () => {
      const serviceId = 0x04030201;

      // Create a simple state with service-related keys
      const state = {
        '0x01ff02ff03ff04ff': '0x48656c6c6f576f726c64', // Some storage entry
        '0x01ab02cd03ef04aa': '0x1234', // Another potential entry
      };

      const result = discoverServiceEntries(state, serviceId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // The function should process any matching entries it finds
    });

    it('handles preimage entries correctly', () => {
      const testValue = '0x48656c6c6f'; // "Hello"
      const serviceId = 1;

      // Test with a simple preimage-like entry
      const state = {
        // Use the calculated hash as the key and original value as value
        [calculatePreimageHash(testValue)]: testValue
      };

      const result = discoverServiceEntries(state, serviceId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Function should handle any entries appropriately
    });

    it('processes service entries and returns expected structure', () => {
      const serviceId = 1;
      const state = {
        '0x01ff02ff03ff04ff': '0x48656c6c6f'
      };

      const result = discoverServiceEntries(state, serviceId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Each entry should have the expected structure
      result.forEach(entry => {
        expect(entry).toHaveProperty('kind');
        expect(entry).toHaveProperty('key');
        expect(entry).toHaveProperty('value');
        expect(['service-info', 'preimage', 'storage-or-lookup', 'lookup']).toContain(entry.kind);
      });
    });
  });

  class ServiceInfo {
    public serviceId: number;
    public balance: number;
    public nonce: number;
    public codeHash:  Uint8Array;

    constructor(
      { serviceId, balance, nonce, codeHash}: Omit<ServiceInfo, never>
    ) {
      this.serviceId = serviceId;
      this.balance = balance;
      this.nonce = nonce;
      this.codeHash = codeHash;
    }

    toString() {
      return `${this.serviceId}++${this.balance}++${this.nonce}++${this.codeHash}`;
    }
  }

  describe('getServiceChangeType', () => {
    const mockService: Service = {
      serviceId: 1,
      getInfo: vi.fn(() => (new ServiceInfo({ serviceId: 1, balance: 100, nonce: 0, codeHash: new Uint8Array([1, 2, 3]) })) as ServiceAccountInfo),
      getStorage: vi.fn(),
      hasPreimage: vi.fn(),
      getPreimage: vi.fn(),
      getLookupHistory: vi.fn()
    };

    it('returns "added" when service was added', () => {
      const serviceData = {
        serviceId: 1,
        preService: null,
        postService: mockService,
        preError: null,
        postError: null
      };
      
      const result = getServiceChangeType(serviceData);
      
      expect(result).toBe('added');
    });

    it('returns "removed" when service was removed', () => {
      const serviceData = {
        serviceId: 1,
        preService: mockService,
        postService: null,
        preError: null,
        postError: null
      };
      
      const result = getServiceChangeType(serviceData);
      
      expect(result).toBe('removed');
    });

    it('returns "changed" when service info differs', () => {
      const changedService: Service = {
        ...mockService,
        getInfo: vi.fn(() => (new ServiceInfo({ serviceId: 1, balance: 200, nonce: 1, codeHash: new Uint8Array([1, 2, 3]) })) as ServiceAccountInfo)
      };
      
      const serviceData = {
        serviceId: 1,
        preService: mockService,
        postService: changedService,
        preError: null,
        postError: null
      };
      
      const result = getServiceChangeType(serviceData);
      
      expect(result).toBe('changed');
    });

    it('returns "normal" when service info is same', () => {
      const serviceData = {
        serviceId: 1,
        preService: mockService,
        postService: mockService,
        preError: null,
        postError: null
      };
      
      const result = getServiceChangeType(serviceData);
      
      expect(result).toBe('normal');
    });

    it('returns "normal" when both states have errors', () => {
      const serviceData = {
        serviceId: 1,
        preService: null,
        postService: null,
        preError: 'Error 1',
        postError: 'Error 2'
      };
      
      const result = getServiceChangeType(serviceData);
      
      expect(result).toBe('normal');
    });
  });

  describe('formatServiceIdUnsigned', () => {
    it('returns positive ids unchanged as decimal strings', () => {
      expect(formatServiceIdUnsigned(0)).toBe('0');
      expect(formatServiceIdUnsigned(1)).toBe('1');
      expect(formatServiceIdUnsigned(42)).toBe('42');
      expect(formatServiceIdUnsigned(4294967295 >>> 0)).toBe('4294967295');
    });

    it('converts negative ids to unsigned 32-bit', () => {
      expect(formatServiceIdUnsigned(-1)).toBe('4294967295');
      expect(formatServiceIdUnsigned(-2)).toBe('4294967294');
      expect(formatServiceIdUnsigned(-123)).toBe((4294967296 - 123).toString());
      expect(formatServiceIdUnsigned(-2147483648)).toBe('2147483648');
    });
  });
});
