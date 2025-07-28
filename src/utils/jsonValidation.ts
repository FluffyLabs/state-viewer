import { z } from 'zod';

export type JsonFileFormat = 'jip4-chainspec' | 'typeberry-config' | 'stf-test-vector' | 'stf-genesis' | 'unknown';

export type StfStateType = 'pre_state' | 'post_state' | 'diff';

export interface JsonValidationResult {
  content: string;
  isValid: boolean;
  error: string | null;
  format: JsonFileFormat;
  formatDescription: string;
  // For STF test vectors, provide state options
  availableStates?: StfStateType[];
}

// Zod Schemas
const KeyValueSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const StateSchema = z.object({
  state_root: z.string(),
  keyvals: z.array(KeyValueSchema),
});

const Jip4ChainspecSchema = z.object({
  id: z.string(),
  bootnodes: z.array(z.string()).optional(),
  genesis_header: z.string(),
  genesis_state: z.record(z.string(), z.string()),
});

const TypeberryConfigSchema = z.object({
  $schema: z.string(),
  version: z.number(),
  flavor: z.string(),
  authorship: z.unknown().optional(),
  chain_spec: Jip4ChainspecSchema,
});

const StfTestVectorSchema = z.object({
  pre_state: StateSchema,
  block: z.unknown(),
  post_state: StateSchema,
});

const StfGenesisHeaderSchema = z.object({
  parent: z.string(),
  parent_state_root: z.string(),
  extrinsic_hash: z.string(),
  slot: z.number(),
  epoch_mark: z.unknown().optional(),
  tickets_mark: z.unknown().optional(),
  offenders_mark: z.array(z.unknown()).optional(),
  author_index: z.number(),
  entropy_source: z.string(),
  seal: z.string(),
});

const StfGenesisSchema = z.object({
  header: StfGenesisHeaderSchema,
  state: StateSchema,
});

// TypeScript interfaces (inferred from Zod schemas)
export type StfTestVector = z.infer<typeof StfTestVectorSchema>;
export type Jip4Chainspec = z.infer<typeof Jip4ChainspecSchema>;
export type TypeberryConfig = z.infer<typeof TypeberryConfigSchema>;
export type StfGenesis = z.infer<typeof StfGenesisSchema>;

export interface DiffEntry {
  key: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: string;
  newValue?: string;
}

interface FormatDetectionResult {
  format: JsonFileFormat;
  description: string;
  data?: unknown;
}

export const calculateStateDiff = (preState: Record<string, string>, postState: Record<string, string>): Record<string, string> => {
  const diffResult: Record<string, string> = {};
  const allKeys = new Set([...Object.keys(preState), ...Object.keys(postState)]);
  
  for (const key of allKeys) {
    const preValue = preState[key];
    const postValue = postState[key];
    
    if (preValue === undefined && postValue !== undefined) {
      // Added
      diffResult[key] = `[ADDED] ${postValue}`;
    } else if (preValue !== undefined && postValue === undefined) {
      // Removed
      diffResult[key] = `[REMOVED] ${preValue}`;
    } else if (preValue !== postValue) {
      // Changed
      diffResult[key] = `[CHANGED] ${preValue} → ${postValue}`;
    }
  }
  
  return diffResult;
};

const detectJsonFormat = (parsedJson: unknown): FormatDetectionResult => {
  if (!parsedJson || typeof parsedJson !== 'object') {
    return { format: 'unknown', description: 'Invalid JSON structure' };
  }

  // Try STF Test Vector first (most specific)
  const stfTestVectorResult = StfTestVectorSchema.safeParse(parsedJson);
  if (stfTestVectorResult.success) {
    return {
      format: 'stf-test-vector',
      description: 'STF Test Vector - contains pre_state and post_state',
      data: stfTestVectorResult.data,
    };
  }

  // Try Typeberry Config
  const typeberryResult = TypeberryConfigSchema.safeParse(parsedJson);
  if (typeberryResult.success) {
    return {
      format: 'typeberry-config',
      description: 'Typeberry Config - contains JIP-4 chainspec in chain_spec field',
      data: typeberryResult.data,
    };
  }

  // Try STF Genesis
  const stfGenesisResult = StfGenesisSchema.safeParse(parsedJson);
  if (stfGenesisResult.success) {
    return {
      format: 'stf-genesis',
      description: 'STF Genesis - contains initial state with header',
      data: stfGenesisResult.data,
    };
  }

  // Try JIP-4 Chainspec
  const jip4Result = Jip4ChainspecSchema.safeParse(parsedJson);
  if (jip4Result.success) {
    return {
      format: 'jip4-chainspec',
      description: 'JIP-4 Chainspec - contains genesis_state directly',
      data: jip4Result.data,
    };
  }

  return { format: 'unknown', description: 'Unknown format - does not match any supported schema' };
};

export const validateJsonContent = (content: string): JsonValidationResult => {
  try {
    const parsedJson = JSON.parse(content);
    
    const { format, description } = detectJsonFormat(parsedJson);
    
    let availableStates: StfStateType[] | undefined;
    if (format === 'stf-test-vector') {
      availableStates = ['pre_state', 'post_state', 'diff'];
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
          error: 'Invalid JSON format. Please check your content and try again.',
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
      case 'jip4-chainspec': {
        const result = Jip4ChainspecSchema.safeParse(parsedJson);
        return result.success ? result.data.genesis_state : null;
      }
        
      case 'typeberry-config': {
        const result = TypeberryConfigSchema.safeParse(parsedJson);
        return result.success ? result.data.chain_spec.genesis_state : null;
      }
        
      case 'stf-test-vector': {
        if (!stateType) {
          throw new Error('State type must be specified for STF test vectors');
        }
        const result = StfTestVectorSchema.safeParse(parsedJson);
        if (!result.success) return null;
        
        if (stateType === 'diff') {
          const preState = extractStateFromStfVector(result.data, 'pre_state');
          const postState = extractStateFromStfVector(result.data, 'post_state');
          return calculateStateDiff(preState, postState);
        }
        
        return extractStateFromStfVector(result.data, stateType);
      }
        
      case 'stf-genesis': {
        const result = StfGenesisSchema.safeParse(parsedJson);
        if (!result.success) return null;
        
        const stateMap: Record<string, string> = {};
        for (const item of result.data.state.keyvals) {
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