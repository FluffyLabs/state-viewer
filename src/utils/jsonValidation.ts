export type JsonFileFormat = 'jip4-chainspec' | 'typeberry-config' | 'stf-test-vector' | 'stf-genesis' | 'unknown';

export type StfStateType = 'pre_state' | 'post_state';

export interface JsonValidationResult {
  content: string;
  isValid: boolean;
  error: string | null;
  format: JsonFileFormat;
  formatDescription: string;
  // For STF test vectors, provide state options
  availableStates?: StfStateType[];
}

export interface StfTestVector {
  pre_state: {
    state_root: string;
    keyvals: Array<{ key: string; value: string }>;
  };
  block: unknown;
  post_state: {
    state_root: string;
    keyvals: Array<{ key: string; value: string }>;
  };
}

export interface Jip4Chainspec {
  id: string;
  bootnodes?: string[];
  genesis_header: string;
  genesis_state: Record<string, string>;
}

export interface TypeberryConfig {
  $schema: string;
  version: number;
  flavor: string;
  authorship?: unknown;
  chain_spec: Jip4Chainspec;
}

export interface StfGenesis {
  header: {
    parent: string;
    parent_state_root: string;
    extrinsic_hash: string;
    slot: number;
    epoch_mark?: unknown;
    tickets_mark?: unknown;
    offenders_mark: unknown[];
    author_index: number;
    entropy_source: string;
    seal: string;
  };
  state: {
    state_root: string;
    keyvals: Array<{ key: string; value: string }>;
  };
}

const detectJsonFormat = (parsedJson: unknown): { format: JsonFileFormat; description: string } => {
  if (!parsedJson || typeof parsedJson !== 'object') {
    return { format: 'unknown', description: 'Invalid JSON structure' };
  }

  const obj = parsedJson as Record<string, unknown>;

  // Check for STF test vector
  if ('pre_state' in obj && 'post_state' in obj && 'block' in obj) {
    const preState = obj.pre_state as Record<string, unknown>;
    const postState = obj.post_state as Record<string, unknown>;
    
    if (preState && typeof preState === 'object' && 
        postState && typeof postState === 'object' &&
        'state_root' in preState && 'keyvals' in preState &&
        'state_root' in postState && 'keyvals' in postState) {
      return { format: 'stf-test-vector', description: 'STF Test Vector - contains pre_state and post_state' };
    }
  }

  // Check for Typeberry config
  if ('$schema' in obj && 'version' in obj && 'chain_spec' in obj) {
    const chainSpec = obj.chain_spec as Record<string, unknown>;
    if (chainSpec && typeof chainSpec === 'object' && 
        'genesis_state' in chainSpec && 'id' in chainSpec) {
      return { format: 'typeberry-config', description: 'Typeberry Config - contains JIP-4 chainspec in chain_spec field' };
    }
  }

  // Check for STF genesis
  if ('header' in obj && 'state' in obj) {
    const header = obj.header as Record<string, unknown>;
    const state = obj.state as Record<string, unknown>;
    
    if (header && typeof header === 'object' && 
        state && typeof state === 'object' &&
        'parent' in header && 'state_root' in state && 'keyvals' in state) {
      return { format: 'stf-genesis', description: 'STF Genesis - contains initial state with header' };
    }
  }

  // Check for JIP-4 chainspec
  if ('genesis_state' in obj && 'id' in obj && 'genesis_header' in obj) {
    const genesisState = obj.genesis_state;
    if (genesisState && typeof genesisState === 'object') {
      return { format: 'jip4-chainspec', description: 'JIP-4 Chainspec - contains genesis_state directly' };
    }
  }

  return { format: 'unknown', description: 'Unknown format - does not match any supported schema' };
};

export const validateJsonContent = (content: string): JsonValidationResult => {
  try {
    const parsedJson = JSON.parse(content);
    
    const { format, description } = detectJsonFormat(parsedJson);
    
    let availableStates: StfStateType[] | undefined;
    if (format === 'stf-test-vector') {
      availableStates = ['pre_state', 'post_state'];
    }

    if (format === 'unknown') {
      return {
        content,
        isValid: false,
        error: `Unsupported JSON format. ${description}. Please upload a JIP-4 chainspec, Typeberry config, STF test vector, or STF genesis file.`,
        format,
        formatDescription: description,
      };
    } else {
      return {
        content,
        isValid: true,
        error: null,
        format,
        formatDescription: description,
        availableStates,
      };
    }
  } catch {
    return {
      content,
      isValid: false,
      error: 'Invalid JSON format. Please check your content and try again.',
      format: 'unknown',
      formatDescription: 'Malformed JSON',
    };
  }
};

export const validateJsonFile = (file: File): Promise<JsonValidationResult> => {
  return new Promise((resolve) => {
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      resolve({
        content: '',
        isValid: false,
        error: 'Please upload a valid JSON file',
        format: 'unknown',
        formatDescription: 'File type not supported',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        const result = validateJsonContent(content);
        resolve(result);
      } catch {
        resolve({
          content: e.target?.result as string || '',
          isValid: false,
          error: 'Invalid JSON format. Please check your file and try again.',
          format: 'unknown',
          formatDescription: 'Malformed JSON',
        });
      }
    };
    reader.onerror = () => {
      resolve({
        content: '',
        isValid: false,
        error: 'Failed to read the file. Please try again.',
        format: 'unknown',
        formatDescription: 'File read error',
      });
    };
    reader.readAsText(file);
  });
};

export const extractStateFromStfVector = (
  stfVector: StfTestVector, 
  stateType: StfStateType
): Record<string, string> => {
  const state = stateType === 'pre_state' ? stfVector.pre_state : stfVector.post_state;
  
  const stateMap: Record<string, string> = {};
  for (const item of state.keyvals) {
    stateMap[item.key] = item.value;
  }
  
  return stateMap;
};

export const extractGenesisState = (
  content: string, 
  format: JsonFileFormat, 
  stateType?: StfStateType
): Record<string, string> | null => {
  try {
    const parsedJson = JSON.parse(content);
    
    switch (format) {
      case 'jip4-chainspec':
        return (parsedJson as Jip4Chainspec).genesis_state;
        
      case 'typeberry-config':
        return (parsedJson as TypeberryConfig).chain_spec.genesis_state;
        
      case 'stf-test-vector':
        if (!stateType) {
          throw new Error('State type must be specified for STF test vectors');
        }
        return extractStateFromStfVector(parsedJson as StfTestVector, stateType);
        
      case 'stf-genesis': {
        const stfGenesis = parsedJson as StfGenesis;
        const stateMap: Record<string, string> = {};
        for (const item of stfGenesis.state.keyvals) {
          stateMap[item.key] = item.value;
        }
        return stateMap;
      }
      default:
        return null;
    }
  } catch (error) {
    // Re-throw intentional errors, only catch JSON parsing errors
    if (error instanceof Error && error.message === 'State type must be specified for STF test vectors') {
      throw error;
    }
    return null;
  }
};