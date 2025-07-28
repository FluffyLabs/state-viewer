import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateJsonFile,
  extractGenesisState,
  extractStateFromStfVector,
  type StfTestVector
} from './jsonValidation';

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  error: Error | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsText(/* file: File */) {
    // Simulate async behavior
    setTimeout(() => {
      if (this.error) {
        this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>);
      } else {
        this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  simulateSuccess(content: string) {
    this.result = content;
    this.error = null;
  }

  simulateError() {
    this.result = null;
    this.error = new Error('File read error');
  }
}

// Replace global FileReader with our mock
const mockFileReader = MockFileReader;
vi.stubGlobal('FileReader', mockFileReader);

describe('validateJsonFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockFile = (name: string, type: string, content?: string): File => {
    const file = new File([content || ''], name, { type });
    return file;
  };

  const mockFileReader = (content: string) => {
    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(content);
      return reader;
    }) as unknown as typeof FileReader;
    return () => { global.FileReader = originalFileReader; };
  };

  describe('JIP-4 Chainspec detection', () => {
    it('should detect JIP-4 chainspec format correctly', async () => {
      const jip4Json = JSON.stringify({
        id: "typeberry-dev",
        bootnodes: ["bootnode1", "bootnode2"],
        genesis_header: "0x123...",
        genesis_state: {
          "0x01": "0x123",
          "0x02": "0x456"
        }
      });

      const file = createMockFile('chainspec.json', 'application/json');
      const restore = mockFileReader(jip4Json);

      const result = await validateJsonFile(file);

      expect(result).toEqual({
        content: jip4Json,
        isValid: true,
        error: null,
        format: 'jip4-chainspec',
        formatDescription: 'JIP-4 Chainspec - contains genesis_state directly',
        availableStates: undefined,
      });

      restore();
    });
  });

  describe('Typeberry Config detection', () => {
    it('should detect Typeberry config format correctly', async () => {
      const typeberryJson = JSON.stringify({
        $schema: "https://fluffylabs.dev/typeberry/schemas/config-v1.schema.json",
        version: 1,
        flavor: "tiny",
        authorship: { omit_seal_verification: false },
        chain_spec: {
          id: "typeberry-dev",
          bootnodes: ["bootnode1"],
          genesis_header: "0x123...",
          genesis_state: {
            "0x01": "0x123",
            "0x02": "0x456"
          }
        }
      });

      const file = createMockFile('typeberry.json', 'application/json');
      const restore = mockFileReader(typeberryJson);

      const result = await validateJsonFile(file);

      expect(result).toEqual({
        content: typeberryJson,
        isValid: true,
        error: null,
        format: 'typeberry-config',
        formatDescription: 'Typeberry Config - contains JIP-4 chainspec in chain_spec field',
        availableStates: undefined,
      });

      restore();
    });
  });

  describe('STF Test Vector detection', () => {
    it('should detect STF test vector format correctly', async () => {
      const stfJson = JSON.stringify({
        pre_state: {
          state_root: "0x3e2f...",
          keyvals: [
            { key: "0x004700b0...", value: "0x0100000000" }
          ]
        },
        block: {
          header: { parent: "0xb5af..." },
          extrinsic: { tickets: [] }
        },
        post_state: {
          state_root: "0x6451...",
          keyvals: [
            { key: "0x004700b0...", value: "0x0100000000" }
          ]
        }
      });

      const file = createMockFile('test-vector.json', 'application/json');
      const restore = mockFileReader(stfJson);

      const result = await validateJsonFile(file);

      expect(result).toEqual({
        content: stfJson,
        isValid: true,
        error: null,
        format: 'stf-test-vector',
        formatDescription: 'STF Test Vector - contains pre_state and post_state',
        availableStates: ['pre_state', 'post_state'],
      });

      restore();
    });
  });

  describe('Unknown format detection', () => {
    it('should detect unknown format and return error', async () => {
      const unknownJson = JSON.stringify({
        some_field: "value",
        another_field: 123
      });

      const file = createMockFile('unknown.json', 'application/json');
      const restore = mockFileReader(unknownJson);

      const result = await validateJsonFile(file);

      expect(result).toEqual({
        content: unknownJson,
        isValid: false,
        error: 'Unsupported JSON format. Unknown format - does not match any supported schema. Please upload a JIP-4 chainspec, Typeberry config, or STF test vector file.',
        format: 'unknown',
        formatDescription: 'Unknown format - does not match any supported schema',
        availableStates: undefined,
      });

      restore();
    });

    it('should handle invalid JSON structure', async () => {
      const invalidStructure = JSON.stringify("just a string");

      const file = createMockFile('invalid.json', 'application/json');
      const restore = mockFileReader(invalidStructure);

      const result = await validateJsonFile(file);

      expect(result.isValid).toBe(false);
      expect(result.format).toBe('unknown');
      expect(result.formatDescription).toBe('Invalid JSON structure');

      restore();
    });
  });

  describe('File validation edge cases', () => {
    it('should reject files with wrong extension', async () => {
      const file = createMockFile('test.txt', 'text/plain');

      const result = await validateJsonFile(file);

      expect(result).toEqual({
        content: '',
        isValid: false,
        error: 'Please upload a valid JSON file',
        format: 'unknown',
        formatDescription: 'File type not supported',
      });
    });

    it('should handle malformed JSON', async () => {
      const malformedJson = '{"incomplete": json}';
      const file = createMockFile('test.json', 'application/json');
      const restore = mockFileReader(malformedJson);

      const result = await validateJsonFile(file);

      expect(result).toEqual({
        content: malformedJson,
        isValid: false,
        error: 'Invalid JSON format. Please check your file and try again.',
        format: 'unknown',
        formatDescription: 'Malformed JSON',
      });

      restore();
    });

    it('should handle FileReader errors', async () => {
      const file = createMockFile('test.json', 'application/json');

      const originalFileReader = global.FileReader;
      global.FileReader = vi.fn().mockImplementation(() => {
        const reader = new MockFileReader();
        reader.simulateError();
        return reader;
      }) as unknown as typeof FileReader;

      const result = await validateJsonFile(file);

      expect(result).toEqual({
        content: '',
        isValid: false,
        error: 'Failed to read the file. Please try again.',
        format: 'unknown',
        formatDescription: 'File read error',
      });

      global.FileReader = originalFileReader;
    });
  });
});

describe('extractStateFromStfVector', () => {
  const mockStfVector: StfTestVector = {
    pre_state: {
      state_root: "0x3e2f...",
      keyvals: [
        { key: "0x01", value: "0x123" },
        { key: "0x02", value: "0x456" }
      ]
    },
    block: {},
    post_state: {
      state_root: "0x6451...",
      keyvals: [
        { key: "0x01", value: "0x789" },
        { key: "0x03", value: "0xabc" }
      ]
    }
  };

  it('should extract pre_state correctly', () => {
    const result = extractStateFromStfVector(mockStfVector, 'pre_state');

    expect(result).toEqual({
      "0x01": "0x123",
      "0x02": "0x456"
    });
  });

  it('should extract post_state correctly', () => {
    const result = extractStateFromStfVector(mockStfVector, 'post_state');

    expect(result).toEqual({
      "0x01": "0x789",
      "0x03": "0xabc"
    });
  });
});

describe('extractGenesisState', () => {
  it('should extract genesis_state from JIP-4 chainspec', () => {
    const jip4Content = JSON.stringify({
      id: "test-chain",
      genesis_header: "0x123...",
      genesis_state: {
        "0x01": "0x123",
        "0x02": "0x456"
      }
    });

    const result = extractGenesisState(jip4Content, 'jip4-chainspec');

    expect(result).toEqual({
      "0x01": "0x123",
      "0x02": "0x456"
    });
  });

  it('should extract genesis_state from Typeberry config', () => {
    const typeberryContent = JSON.stringify({
      $schema: "https://example.com/schema.json",
      version: 1,
      chain_spec: {
        id: "test-chain",
        genesis_header: "0x123...",
        genesis_state: {
          "0x01": "0x789",
          "0x02": "0xabc"
        }
      }
    });

    const result = extractGenesisState(typeberryContent, 'typeberry-config');

    expect(result).toEqual({
      "0x01": "0x789",
      "0x02": "0xabc"
    });
  });

  it('should extract state from STF test vector with pre_state', () => {
    const stfContent = JSON.stringify({
      pre_state: {
        state_root: "0x3e2f...",
        keyvals: [
          { key: "0x01", value: "0x123" },
          { key: "0x02", value: "0x456" }
        ]
      },
      block: {},
      post_state: {
        state_root: "0x6451...",
        keyvals: [
          { key: "0x01", value: "0x789" }
        ]
      }
    });

    const result = extractGenesisState(stfContent, 'stf-test-vector', 'pre_state');

    expect(result).toEqual({
      "0x01": "0x123",
      "0x02": "0x456"
    });
  });

  it('should extract state from STF test vector with post_state', () => {
    const stfContent = JSON.stringify({
      pre_state: {
        state_root: "0x3e2f...",
        keyvals: [
          { key: "0x01", value: "0x123" }
        ]
      },
      block: {},
      post_state: {
        state_root: "0x6451...",
        keyvals: [
          { key: "0x01", value: "0x789" },
          { key: "0x03", value: "0xdef" }
        ]
      }
    });

    const result = extractGenesisState(stfContent, 'stf-test-vector', 'post_state');

    expect(result).toEqual({
      "0x01": "0x789",
      "0x03": "0xdef"
    });
  });

  it('should throw error for STF test vector without state type', () => {
    const stfContent = JSON.stringify({
      pre_state: { state_root: "0x123...", keyvals: [] },
      block: {},
      post_state: { state_root: "0x456...", keyvals: [] }
    });

    expect(() => extractGenesisState(stfContent, 'stf-test-vector')).toThrow(
      'State type must be specified for STF test vectors'
    );
  });

  it('should return null for unknown format', () => {
    const unknownContent = JSON.stringify({ some: "data" });

    const result = extractGenesisState(unknownContent, 'unknown');

    expect(result).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    const malformedContent = '{"incomplete": json}';

    const result = extractGenesisState(malformedContent, 'jip4-chainspec');

    expect(result).toBeNull();
  });

  it('should handle empty keyvals array in STF test vector', () => {
    const stfContent = JSON.stringify({
      pre_state: {
        state_root: "0x123...",
        keyvals: []
      },
      block: {},
      post_state: {
        state_root: "0x456...",
        keyvals: []
      }
    });

    const result = extractGenesisState(stfContent, 'stf-test-vector', 'pre_state');

    expect(result).toEqual({});
  });
});

describe('Integration tests with fixture files', () => {
  const mockFileReaderWithContent = (content: string) => {
    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(content);
      return reader;
    }) as unknown as typeof FileReader;
    return () => { global.FileReader = originalFileReader; };
  };

  it('should detect JIP-4 chainspec from dev-tiny.json fixture', async () => {
    const jip4Content = `{
    "id": "typeberry-dev",
    "bootnodes": [
      "e3r2oc62zwfj3crnuifuvsxvbtlzetk4o5qyhetkhagsc2fgl2oka@127.0.0.1:40000"
    ],
    "genesis_header": "0000000000000000000000000000000000000000000000000000000000000000",
    "genesis_state": {
      "01000000000000000000000000000000000000000000000000000000000000": "08000000000000000000000000000000000000000000000000000000000000",
      "02000000000000000000000000000000000000000000000000000000000000": "0b27478648cd19b4f812f897a26976ecf312eac28508b4368d0c63ea949c7cb0"
    }
}`;

    const file = new File([jip4Content], 'dev-tiny.json', { type: 'application/json' });
    const restore = mockFileReaderWithContent(jip4Content);

    const result = await validateJsonFile(file);

    expect(result.isValid).toBe(true);
    expect(result.format).toBe('jip4-chainspec');
    expect(result.formatDescription).toBe('JIP-4 Chainspec - contains genesis_state directly');
    expect(result.availableStates).toBeUndefined();

    // Test extracting genesis state
    const genesisState = extractGenesisState(jip4Content, 'jip4-chainspec');
    expect(genesisState).toBeDefined();
    expect(genesisState!['01000000000000000000000000000000000000000000000000000000000000']).toBe('08000000000000000000000000000000000000000000000000000000000000');

    restore();
  });

  it('should detect Typeberry config from typeberry-dev.json fixture', async () => {
    const typeberryContent = `{
  "$schema": "https://fluffylabs.dev/typeberry/schemas/config-v1.schema.json",
  "version": 1,
  "flavor": "tiny",
  "authorship": {
    "omit_seal_verification": false
  },
  "chain_spec": {
    "id": "typeberry-dev",
    "bootnodes": [
      "e3r2oc62zwfj3crnuifuvsxvbtlzetk4o5qyhetkhagsc2fgl2oka@127.0.0.1:40000"
    ],
    "genesis_header": "0000000000000000000000000000000000000000000000000000000000000000",
    "genesis_state": {
      "01000000000000000000000000000000000000000000000000000000000000": "08000000000000000000000000000000000000000000000000000000000000",
      "02000000000000000000000000000000000000000000000000000000000000": "0b27478648cd19b4f812f897a26976ecf312eac28508b4368d0c63ea949c7cb0"
    }
  }
}`;

    const file = new File([typeberryContent], 'typeberry-dev.json', { type: 'application/json' });
    const restore = mockFileReaderWithContent(typeberryContent);

    const result = await validateJsonFile(file);

    expect(result.isValid).toBe(true);
    expect(result.format).toBe('typeberry-config');
    expect(result.formatDescription).toBe('Typeberry Config - contains JIP-4 chainspec in chain_spec field');
    expect(result.availableStates).toBeUndefined();

    // Test extracting genesis state from embedded chain_spec
    const genesisState = extractGenesisState(typeberryContent, 'typeberry-config');
    expect(genesisState).toBeDefined();
    expect(genesisState!['01000000000000000000000000000000000000000000000000000000000000']).toBe('08000000000000000000000000000000000000000000000000000000000000');

    restore();
  });

  it('should detect STF test vector from 00000001.json fixture', async () => {
    const stfContent = `{
    "pre_state": {
        "state_root": "0x3e2f03c8e9f44101d4945260f81a0c5a400c18fe7a0fbdb4413e8b9163239836",
        "keyvals": [
            {
                "key": "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e",
                "value": "0x0100000000"
            }
        ]
    },
    "block": {
        "header": {
            "parent": "0xb5af8edad70d962097eefa2cef92c8284cf0a7578b70a6b7554cf53ae6d51222",
            "parent_state_root": "0x3e2f03c8e9f44101d4945260f81a0c5a400c18fe7a0fbdb4413e8b9163239836"
        },
        "extrinsic": {
            "tickets": [],
            "preimages": []
        }
    },
    "post_state": {
        "state_root": "0x645153c6fa8227d0bf88474668da47b125c7c6aa48e373f9819be8dcf2f30962",
        "keyvals": [
            {
                "key": "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e",
                "value": "0x0100000000"
            }
        ]
    }
}`;

    const file = new File([stfContent], '00000001.json', { type: 'application/json' });
    const restore = mockFileReaderWithContent(stfContent);

    const result = await validateJsonFile(file);

    expect(result.isValid).toBe(true);
    expect(result.format).toBe('stf-test-vector');
    expect(result.formatDescription).toBe('STF Test Vector - contains pre_state and post_state');
    expect(result.availableStates).toEqual(['pre_state', 'post_state']);

    // Test extracting both pre and post states
    const preState = extractGenesisState(stfContent, 'stf-test-vector', 'pre_state');
    expect(preState).toBeDefined();
    expect(preState!['0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e']).toBe('0x0100000000');

    const postState = extractGenesisState(stfContent, 'stf-test-vector', 'post_state');
    expect(postState).toBeDefined();
    expect(postState!['0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e']).toBe('0x0100000000');

    restore();
  });

  it('should handle edge case where STF states have different keyvals', async () => {
    const stfContent = `{
    "pre_state": {
        "state_root": "0x3e2f03c8e9f44101d4945260f81a0c5a400c18fe7a0fbdb4413e8b9163239836",
        "keyvals": [
            {
                "key": "0x001122",
                "value": "0x123456"
            },
            {
                "key": "0x003344",
                "value": "0x789abc"
            }
        ]
    },
    "block": {},
    "post_state": {
        "state_root": "0x645153c6fa8227d0bf88474668da47b125c7c6aa48e373f9819be8dcf2f30962",
        "keyvals": [
            {
                "key": "0x001122",
                "value": "0xffffff"
            },
            {
                "key": "0x005566",
                "value": "0xdeadbeef"
            }
        ]
    }
}`;

    const file = new File([stfContent], 'test-vector.json', { type: 'application/json' });
    const restore = mockFileReaderWithContent(stfContent);

    const result = await validateJsonFile(file);

    expect(result.isValid).toBe(true);
    expect(result.format).toBe('stf-test-vector');

    // Verify pre_state extraction
    const preState = extractGenesisState(stfContent, 'stf-test-vector', 'pre_state');
    expect(preState).toEqual({
      '0x001122': '0x123456',
      '0x003344': '0x789abc'
    });

    // Verify post_state extraction
    const postState = extractGenesisState(stfContent, 'stf-test-vector', 'post_state');
    expect(postState).toEqual({
      '0x001122': '0xffffff',
      '0x005566': '0xdeadbeef'
    });

    restore();
  });
});
