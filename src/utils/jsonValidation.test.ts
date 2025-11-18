import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateJsonFile,
  validateJsonContent,
  extractInputData,
  calculateStateDiff,
  convertCamelCaseToSnake,
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
    global.FileReader = vi.fn(function() {
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
        availableStates: ['post_state'],
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
        availableStates: ['post_state'],
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
        availableStates: ['pre_state', 'post_state', 'diff'],
      });

      restore();
    });
  });

  describe('STF Genesis detection', () => {
    it('should detect STF genesis format correctly', async () => {
      const stfGenesisJson = JSON.stringify({
        header: {
          parent: "0x0000000000000000000000000000000000000000000000000000000000000000",
          parent_state_root: "0x0000000000000000000000000000000000000000000000000000000000000000",
          extrinsic_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
          slot: 0,
          epoch_mark: null,
          tickets_mark: null,
          offenders_mark: [],
          author_index: 65535,
          entropy_source: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          seal: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        },
        state: {
          state_root: "0x3e2f03c8e9f44101d4945260f81a0c5a400c18fe7a0fbdb4413e8b9163239836",
          keyvals: [
            { key: "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e", value: "0x0100000000" }
          ]
        }
      });

      const file = createMockFile('genesis.json', 'application/json');
      const restore = mockFileReader(stfGenesisJson);

      const result = await validateJsonFile(file);

      expect(result).toEqual({
        content: stfGenesisJson,
        isValid: true,
        error: null,
        format: 'stf-genesis',
        formatDescription: 'STF Genesis - contains initial state with header',
        availableStates: ['post_state'],
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
        error: 'Unsupported JSON format. Unknown format - does not match any supported schema. Please upload a JIP-4 chainspec, Typeberry config, STF test vector, or STF genesis file.',
        format: 'unknown',
        formatDescription: 'Unknown format - does not match any supported schema',
        availableStates: [],
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
        availableStates: [],
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
        error: 'Invalid JSON format. Please check your content and try again.',
        format: 'unknown',
        formatDescription: 'Malformed JSON',
        availableStates: [],
      });

      restore();
    });

    it('should handle FileReader errors', async () => {
      const file = createMockFile('test.json', 'application/json');

      const originalFileReader = global.FileReader;
      global.FileReader = vi.fn(function() {
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
        availableStates: [],
      });

      global.FileReader = originalFileReader;
    });
  });
});

describe('extractInputData', () => {
  it('should extract genesis_state from JIP-4 chainspec', () => {
    const jip4Content = JSON.stringify({
      id: "test-chain",
      genesis_header: "0x123...",
      genesis_state: {
        "0x01": "0x123",
        "0x02": "0x456"
      }
    });

    const result = extractInputData(jip4Content, 'jip4-chainspec');

    expect(result.state).toEqual({
      "0x01": "0x123",
      "0x02": "0x456"
    });
  });

  it('should extract genesis_state from Typeberry config', () => {
    const typeberryContent = JSON.stringify({
      $schema: "https://example.com/schema.json",
      version: 1,
      flavor: "test",
      chain_spec: {
        id: "test-chain",
        genesis_header: "0x123...",
        genesis_state: {
          "0x01": "0x789",
          "0x02": "0xabc"
        }
      }
    });

    const result = extractInputData(typeberryContent, 'typeberry-config');

    expect(result.state).toEqual({
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

    const result = extractInputData(stfContent, 'stf-test-vector');

    expect(result.preState).toEqual({
      "0x01": "0x123",
      "0x02": "0x456"
    });
    expect(result.block).toEqual({});
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

    const result = extractInputData(stfContent, 'stf-test-vector');
    
    expect(result.state).toEqual({
      "0x01": "0x789",
      "0x03": "0xdef"
    });
  });

  it('should extract state from STF genesis', () => {
    const stfGenesisContent = JSON.stringify({
      header: {
        parent: "0x0000000000000000000000000000000000000000000000000000000000000000",
        parent_state_root: "0x0000000000000000000000000000000000000000000000000000000000000000",
        extrinsic_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        slot: 0,
        offenders_mark: [],
        author_index: 65535,
        entropy_source: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        seal: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      },
      state: {
        state_root: "0x3e2f03c8e9f44101d4945260f81a0c5a400c18fe7a0fbdb4413e8b9163239836",
        keyvals: [
          { key: "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e", value: "0x0100000000" },
          { key: "0x01", value: "0x123456" }
        ]
      }
    });

    const result = extractInputData(stfGenesisContent, 'stf-genesis');

    expect(result.state).toEqual({
      "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e": "0x0100000000",
      "0x01": "0x123456"
    });
  });

  it('should extract both states from STF test vector', () => {
    const stfContent = JSON.stringify({
      pre_state: { 
        state_root: "0x123...", 
        keyvals: [
          { key: "0x01", value: "0x123" },
          { key: "0x02", value: "0x456" }
        ] 
      },
      block: {},
      post_state: { 
        state_root: "0x456...", 
        keyvals: [
          { key: "0x01", value: "0x123" },
          { key: "0x02", value: "0x789" },
          { key: "0x03", value: "0xabc" }
        ] 
      }
    });

    const result = extractInputData(stfContent, 'stf-test-vector');
    expect(result.state).toEqual({
      "0x01": "0x123",
      "0x02": "0x789",
      "0x03": "0xabc"
    });
    expect(result.preState).toEqual({
      "0x01": "0x123",
      "0x02": "0x456"
    });
  });

  it('should return null for unknown format', () => {
    const unknownContent = JSON.stringify({ some: "data" });

    const result = extractInputData(unknownContent, 'unknown');

    expect(result.state).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    const malformedContent = '{"incomplete": json}';

    const result = extractInputData(malformedContent, 'jip4-chainspec');

    expect(result.state).toBeNull();
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

    const result = extractInputData(stfContent, 'stf-test-vector');

    expect(result).toEqual({ state: {}, preState: {} });
  });
});

describe('Integration tests with fixture files', () => {
  const mockFileReaderWithContent = (content: string) => {
    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn(function() {
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
    expect(result.availableStates).toEqual(['post_state']);

    // Test extracting genesis state
    const genesisState = extractInputData(jip4Content, 'jip4-chainspec');
    expect(genesisState).toBeDefined();
    expect(genesisState.state!['0x01000000000000000000000000000000000000000000000000000000000000']).toBe('0x08000000000000000000000000000000000000000000000000000000000000');

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
    expect(result.availableStates).toEqual(['post_state']);

    // Test extracting genesis state from embedded chain_spec
    const genesisState = extractInputData(typeberryContent, 'typeberry-config');
    expect(genesisState).toBeDefined();
    expect(genesisState.state!['0x01000000000000000000000000000000000000000000000000000000000000']).toBe('0x08000000000000000000000000000000000000000000000000000000000000');

    restore();
  });

  it('should detect STF test vector from 00000041.json fixture', async () => {
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

    const file = new File([stfContent], '00000041.json', { type: 'application/json' });
    const restore = mockFileReaderWithContent(stfContent);

    const result = await validateJsonFile(file);

    expect(result.isValid).toBe(true);
    expect(result.format).toBe('stf-test-vector');
    expect(result.formatDescription).toBe('STF Test Vector - contains pre_state and post_state');
    expect(result.availableStates).toEqual(['pre_state', 'post_state', 'diff']);

    // Test extracting both pre and post states
    const genesisState = extractInputData(stfContent, 'stf-test-vector');
    expect(genesisState.preState).toBeDefined();
    expect(genesisState.preState!['0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e']).toBe('0x0100000000');

    expect(genesisState.state).toBeDefined();
    expect(genesisState.state!['0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e']).toBe('0x0100000000');

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
    const extractedStates = extractInputData(stfContent, 'stf-test-vector');
    expect(extractedStates.preState).toEqual({
      '0x001122': '0x123456',
      '0x003344': '0x789abc'
    });

    // Verify post_state extraction
    expect(extractedStates.state).toEqual({
      '0x001122': '0xffffff',
      '0x005566': '0xdeadbeef'
    });

    restore();
  });

  it('should detect STF genesis from genesis.json fixture', async () => {
    const stfGenesisContent = `{
    "header": {
        "parent": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "parent_state_root": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "extrinsic_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "slot": 0,
        "epoch_mark": null,
        "tickets_mark": null,
        "offenders_mark": [],
        "author_index": 65535,
        "entropy_source": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "seal": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    },
    "state": {
        "state_root": "0x3e2f03c8e9f44101d4945260f81a0c5a400c18fe7a0fbdb4413e8b9163239836",
        "keyvals": [
            {
                "key": "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e",
                "value": "0x0100000000"
            }
        ]
    }
}`;

    const file = new File([stfGenesisContent], 'genesis.json', { type: 'application/json' });
    const restore = mockFileReaderWithContent(stfGenesisContent);

    const result = await validateJsonFile(file);

    expect(result.isValid).toBe(true);
    expect(result.format).toBe('stf-genesis');
    expect(result.formatDescription).toBe('STF Genesis - contains initial state with header');
    expect(result.availableStates).toEqual(['post_state']);

    // Test extracting genesis state
    const genesisState = extractInputData(stfGenesisContent, 'stf-genesis');
    expect(genesisState).toBeDefined();
    expect(genesisState.state!['0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e']).toBe('0x0100000000');

    restore();
  });
});

describe('validateJsonContent', () => {
  const jip4Json = JSON.stringify({
    id: "dev-tiny",
    genesis_header: "0x0000000000000000000000000000000000000000000000000000000000000000",
    genesis_state: {
      "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e": "0x0100000000"
    }
  });

  const typeberryJson = JSON.stringify({
    $schema: "https://api.typeberry.xyz/schema/v0.1.3/config.json",
    version: 1,
    flavor: "dev",
    chain_spec: {
      id: "dev-tiny",
      genesis_header: "0x0000000000000000000000000000000000000000000000000000000000000000",
      genesis_state: {
        "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e": "0x0100000000"
      }
    }
  });

  const stfJson = JSON.stringify({
    pre_state: {
      state_root: "0x12345",
      keyvals: [
        { key: "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e", value: "0x0100000000" }
      ]
    },
    block: { slot: 1 },
    post_state: {
      state_root: "0x67890",
      keyvals: [
        { key: "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e", value: "0x0200000000" }
      ]
    }
  });

  const stfGenesisJson = JSON.stringify({
    header: {
      parent: "0x0000000000000000000000000000000000000000000000000000000000000000",
      parent_state_root: "0x0000000000000000000000000000000000000000000000000000000000000000",
      extrinsic_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      slot: 0,
      author_index: 0,
      entropy_source: "0x0000000000000000000000000000000000000000000000000000000000000000",
      seal: "0x0000000000000000000000000000000000000000000000000000000000000000",
      offenders_mark: []
    },
    state: {
      state_root: "0x12345",
      keyvals: [
        { key: "0x004700b0000000000b0cce53c35439dfe73087b1439c846b5ff0b18ec0052e", value: "0x0100000000" }
      ]
    }
  });

  describe('JIP-4 Chainspec detection', () => {
    it('should detect JIP-4 chainspec format correctly', () => {
      const result = validateJsonContent(jip4Json);

      expect(result).toEqual({
        content: jip4Json,
        isValid: true,
        error: null,
        format: 'jip4-chainspec',
        formatDescription: 'JIP-4 Chainspec - contains genesis_state directly',
        availableStates: ['post_state'],
      });
    });
  });

  describe('Typeberry Config detection', () => {
    it('should detect Typeberry config format correctly', () => {
      const result = validateJsonContent(typeberryJson);

      expect(result).toEqual({
        content: typeberryJson,
        isValid: true,
        error: null,
        format: 'typeberry-config',
        formatDescription: 'Typeberry Config - contains JIP-4 chainspec in chain_spec field',
        availableStates: ['post_state'],
      });
    });
  });

  describe('STF Test Vector detection', () => {
    it('should detect STF test vector format correctly', () => {
      const result = validateJsonContent(stfJson);

      expect(result).toEqual({
        content: stfJson,
        isValid: true,
        error: null,
        format: 'stf-test-vector',
        formatDescription: 'STF Test Vector - contains pre_state and post_state',
        availableStates: ['pre_state', 'post_state', 'diff'],
      });
    });
  });

  describe('STF Genesis detection', () => {
    it('should detect STF genesis format correctly', () => {
      const result = validateJsonContent(stfGenesisJson);

      expect(result).toEqual({
        content: stfGenesisJson,
        isValid: true,
        error: null,
        format: 'stf-genesis',
        formatDescription: 'STF Genesis - contains initial state with header',
        availableStates: ['post_state'],
      });
    });
  });

  describe('Unknown format detection', () => {
    it('should detect unknown format and return error', () => {
      const unknownJson = JSON.stringify({
        some_field: "value",
        another_field: 123
      });

      const result = validateJsonContent(unknownJson);

      expect(result.isValid).toBe(false);
      expect(result.format).toBe('unknown');
      expect(result.formatDescription).toBe('Unknown format - does not match any supported schema');
      expect(result.error).toContain('Unsupported JSON format');
    });

    it('should handle invalid JSON structure', () => {
      const invalidStructure = JSON.stringify("just a string");

      const result = validateJsonContent(invalidStructure);

      expect(result.isValid).toBe(false);
      expect(result.format).toBe('unknown');
      expect(result.formatDescription).toBe('Invalid JSON structure');
    });
  });

  describe('Malformed JSON handling', () => {
    it('should handle malformed JSON', () => {
      const malformedJson = '{"incomplete": json}';

      const result = validateJsonContent(malformedJson);

      expect(result).toEqual({
        content: malformedJson,
        isValid: false,
        error: 'Invalid JSON format. Please check your content and try again.',
        format: 'unknown',
        formatDescription: 'Malformed JSON',
        availableStates: [],
      });
    });

    it('should handle empty content', () => {
      const result = validateJsonContent('');

      expect(result.isValid).toBe(false);
      expect(result.format).toBe('unknown');
      expect(result.formatDescription).toBe('Malformed JSON');
    });
  });

  describe('calculateStateDiff', () => {
    it('should detect added keys', () => {
      const preState = {
        "0x01": "0x123"
      };
      const postState = {
        "0x01": "0x123",
        "0x02": "0x456"
      };

      const diff = calculateStateDiff(preState, postState);

      expect(diff).toEqual({
        "0x02": "[ADDED] 0x456"
      });
    });

    it('should detect removed keys', () => {
      const preState = {
        "0x01": "0x123",
        "0x02": "0x456"
      };
      const postState = {
        "0x01": "0x123"
      };

      const diff = calculateStateDiff(preState, postState);

      expect(diff).toEqual({
        "0x02": "[REMOVED] 0x456"
      });
    });

    it('should detect changed values', () => {
      const preState = {
        "0x01": "0x123",
        "0x02": "0x456"
      };
      const postState = {
        "0x01": "0x123",
        "0x02": "0x789"
      };

      const diff = calculateStateDiff(preState, postState);

      expect(diff).toEqual({
        "0x02": "[CHANGED] 0x456 → 0x789"
      });
    });

    it('should handle mixed scenarios', () => {
      const preState = {
        "0x01": "0x123",
        "0x02": "0x456",
        "0x03": "0x789"
      };
      const postState = {
        "0x01": "0x123",
        "0x02": "0xabc",
        "0x04": "0xdef"
      };

      const diff = calculateStateDiff(preState, postState);

      expect(diff).toEqual({
        "0x02": "[CHANGED] 0x456 → 0xabc",
        "0x03": "[REMOVED] 0x789",
        "0x04": "[ADDED] 0xdef"
      });
    });

    it('should handle empty states', () => {
      const preState = {};
      const postState = {
        "0x01": "0x123"
      };

      const diff = calculateStateDiff(preState, postState);

      expect(diff).toEqual({
        "0x01": "[ADDED] 0x123"
      });
    });

    it('should return empty diff for identical states', () => {
      const preState = {
        "0x01": "0x123",
        "0x02": "0x456"
      };
      const postState = {
        "0x01": "0x123",
        "0x02": "0x456"
      };

      const diff = calculateStateDiff(preState, postState);

      expect(diff).toEqual({});
    });
  });

  describe('extractGenesisState with diff', () => {
    it('should extract diff for STF test vector', () => {
      const stfContent = JSON.stringify({
        pre_state: {
          state_root: "0x12345",
          keyvals: [
            { key: "0x01", value: "0x123" },
            { key: "0x02", value: "0x456" }
          ]
        },
        block: { slot: 1 },
        post_state: {
          state_root: "0x67890",
          keyvals: [
            { key: "0x01", value: "0x123" },
            { key: "0x02", value: "0x789" },
            { key: "0x03", value: "0xabc" }
          ]
        }
      });

      const result = extractInputData(stfContent, 'stf-test-vector');

      expect(result.preState).toEqual({
        "0x01": "0x123",
        "0x02": "0x456"
      });
      expect(result.state).toEqual({
        "0x01": "0x123",
        "0x02": "0x789",
        "0x03": "0xabc"
      });
    });

    it('should extract both states from STF test vector for diff calculation', () => {
      const stfContent = JSON.stringify({
        pre_state: { 
          state_root: "0x123", 
          keyvals: [
            { key: "0x01", value: "0x123" },
            { key: "0x02", value: "0x456" }
          ] 
        },
        block: {},
        post_state: { 
          state_root: "0x456", 
          keyvals: [
            { key: "0x01", value: "0x123" },
            { key: "0x02", value: "0x789" },
            { key: "0x03", value: "0xabc" }
          ] 
        }
      });

      const result = extractInputData(stfContent, 'stf-test-vector');
      expect(result.state).toEqual({
        "0x01": "0x123",
        "0x02": "0x789",
        "0x03": "0xabc"
      });
      expect(result.preState).toEqual({
        "0x01": "0x123",
        "0x02": "0x456"
      });
    });
  });

  describe('validateJsonContent with diff state', () => {
    it('should include diff in available states for STF test vector', () => {
      const stfJson = JSON.stringify({
        pre_state: {
          state_root: "0x12345",
          keyvals: [
            { key: "0x01", value: "0x123" }
          ]
        },
        block: { slot: 1 },
        post_state: {
          state_root: "0x67890",
          keyvals: [
            { key: "0x01", value: "0x456" }
          ]
        }
      });

      const result = validateJsonContent(stfJson);

      expect(result.isValid).toBe(true);
      expect(result.format).toBe('stf-test-vector');
      expect(result.availableStates).toEqual(['pre_state', 'post_state', 'diff']);
    });
  });

  describe('Zod validation edge cases', () => {
    describe('Type validation errors', () => {
      it('should reject JIP-4 chainspec with invalid data types', () => {
        const invalidJip4 = JSON.stringify({
          id: 123, // should be string
          genesis_header: "0x0000000000000000000000000000000000000000000000000000000000000000",
          genesis_state: {
            "0x01": "0x123"
          }
        });

        const result = validateJsonContent(invalidJip4);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.error).toContain('Unsupported JSON format');
      });

      it('should reject Typeberry config with invalid version type', () => {
        const invalidTypeberry = JSON.stringify({
          $schema: "https://example.com/schema.json",
          version: "1", // should be number
          flavor: "test",
          chain_spec: {
            id: "test-chain",
            genesis_header: "0x123",
            genesis_state: {
              "0x01": "0x789"
            }
          }
        });

        const result = validateJsonContent(invalidTypeberry);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.error).toContain('Unsupported JSON format');
      });

      it('should reject STF test vector with invalid keyvals structure', () => {
        const invalidStf = JSON.stringify({
          pre_state: {
            state_root: "0x12345",
            keyvals: "invalid" // should be array
          },
          block: { slot: 1 },
          post_state: {
            state_root: "0x67890",
            keyvals: []
          }
        });

        const result = validateJsonContent(invalidStf);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.error).toContain('Unsupported JSON format');
      });

      it('should accept STF genesis even with non-standard header fields', () => {
        // The schema uses z.unknown() for header, so it's lenient about header structure
        const stfGenesisWithStringSlot = JSON.stringify({
          header: {
            parent: "0x0000000000000000000000000000000000000000000000000000000000000000",
            parent_state_root: "0x0000000000000000000000000000000000000000000000000000000000000000",
            extrinsic_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
            slot: "0", // normally a number, but schema is lenient
            offenders_mark: [],
            author_index: 65535,
            entropy_source: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            seal: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
          },
          state: {
            state_root: "0x3e2f03c8e9f44101d4945260f81a0c5a400c18fe7a0fbdb4413e8b9163239836",
            keyvals: []
          }
        });

        const result = validateJsonContent(stfGenesisWithStringSlot);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('stf-genesis');
        expect(result.formatDescription).toBe('STF Genesis - contains initial state with header');
      });
    });

    describe('Missing required fields', () => {
      it('should reject JIP-4 chainspec missing required fields', () => {
        const incompleteJip4 = JSON.stringify({
          id: "test-chain",
          // missing genesis_header
          genesis_state: {
            "0x01": "0x123"
          }
        });

        const result = validateJsonContent(incompleteJip4);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.error).toContain('Unsupported JSON format');
      });

      it('should reject Typeberry config missing chain_spec', () => {
        const incompleteTypeberry = JSON.stringify({
          $schema: "https://example.com/schema.json",
          version: 1,
          flavor: "test"
          // missing chain_spec
        });

        const result = validateJsonContent(incompleteTypeberry);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.error).toContain('Unsupported JSON format');
      });

      it('should reject STF test vector missing post_state', () => {
        const incompleteStf = JSON.stringify({
          pre_state: {
            state_root: "0x12345",
            keyvals: []
          },
          block: { slot: 1 }
          // missing post_state
        });

        const result = validateJsonContent(incompleteStf);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.error).toContain('Unsupported JSON format');
      });
    });

    describe('Invalid nested structures', () => {
      it('should reject STF test vector with malformed keyvals', () => {
        const malformedStf = JSON.stringify({
          pre_state: {
            state_root: "0x12345",
            keyvals: [
              { key: "0x01" } // missing value
            ]
          },
          block: { slot: 1 },
          post_state: {
            state_root: "0x67890",
            keyvals: []
          }
        });

        const result = validateJsonContent(malformedStf);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.error).toContain('Unsupported JSON format');
      });

      it('should reject Typeberry config with invalid nested chain_spec', () => {
        const invalidNested = JSON.stringify({
          $schema: "https://example.com/schema.json",
          version: 1,
          flavor: "test",
          chain_spec: "invalid" // should be object
        });

        const result = validateJsonContent(invalidNested);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.error).toContain('Unsupported JSON format');
      });
    });

    describe('Optional fields handling', () => {
      it('should accept STF genesis without optional epoch_mark and tickets_mark', () => {
        const stfGenesisWithoutOptional = JSON.stringify({
          header: {
            parent: "0x0000000000000000000000000000000000000000000000000000000000000000",
            parent_state_root: "0x0000000000000000000000000000000000000000000000000000000000000000",
            extrinsic_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
            slot: 0,
            author_index: 65535,
            entropy_source: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            seal: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            // offenders_mark is also optional
          },
          state: {
            state_root: "0x3e2f03c8e9f44101d4945260f81a0c5a400c18fe7a0fbdb4413e8b9163239836",
            keyvals: [
              { key: "0x01", value: "0x123456" }
            ]
          }
        });

        const result = validateJsonContent(stfGenesisWithoutOptional);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('stf-genesis');
        expect(result.formatDescription).toBe('STF Genesis - contains initial state with header');
      });

      it('should accept JIP-4 chainspec without optional bootnodes', () => {
        const jip4WithoutBootnodes = JSON.stringify({
          id: "test-chain",
          genesis_header: "0x0000000000000000000000000000000000000000000000000000000000000000",
          genesis_state: {
            "0x01": "0x123"
          }
          // bootnodes is optional
        });

        const result = validateJsonContent(jip4WithoutBootnodes);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('jip4-chainspec');
        expect(result.formatDescription).toBe('JIP-4 Chainspec - contains genesis_state directly');
      });
    });
  });
});

describe('convertCamelCaseToSnake', () => {
  it('should convert simple camelCase properties to snake_case', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
      emailAddress: 'john@example.com'
    };

    const result = convertCamelCaseToSnake(input);

    expect(result).toEqual({
      first_name: 'John',
      last_name: 'Doe',
      email_address: 'john@example.com'
    });
  });

  it('should handle nested objects and convert all property keys', () => {
    const input = {
      userName: 'testUser',
      userProfile: {
        firstName: 'Jane',
        lastName: 'Smith',
        contactInfo: {
          phoneNumber: '123-456-7890',
          emailAddress: 'jane@example.com'
        }
      }
    };

    const result = convertCamelCaseToSnake(input);

    expect(result).toEqual({
      user_name: 'testUser',
      user_profile: {
        first_name: 'Jane',
        last_name: 'Smith',
        contact_info: {
          phone_number: '123-456-7890',
          email_address: 'jane@example.com'
        }
      }
    });
  });

  it('should handle arrays with objects and preserve primitive values', () => {
    const input = {
      userList: [
        { firstName: 'Alice', accountType: 'admin' },
        { firstName: 'Bob', accountType: 'user' }
      ],
      itemCount: 42,
      isActive: true,
      nullValue: null
    };

    const result = convertCamelCaseToSnake(input);

    expect(result).toEqual({
      user_list: [
        { first_name: 'Alice', account_type: 'admin' },
        { first_name: 'Bob', account_type: 'user' }
      ],
      item_count: 42,
      is_active: true,
      null_value: null
    });
  });
});
