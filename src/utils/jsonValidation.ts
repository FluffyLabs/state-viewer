import {JsonFileFormat, RawState, StfStateType} from '@/types/shared';
import { z } from 'zod';

export function isValidStateType(state?: string): state is StfStateType {
  return state === 'pre_state' || state === 'post_state' || state === 'diff' || state === 'exec_diff';
}

export interface JsonValidationResult {
  content: string;
  isValid: boolean;
  error: string | null;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates: StfStateType[];
  fileName?: string;
}

// Zod Schemas
const KeyValueSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const RawStateFileSchema = z.object({
  state: z.array(KeyValueSchema),
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

const StfGenesisSchema = z.object({
  header: z.unknown(),
  state: StateSchema,
});

// TypeScript interfaces (inferred from Zod schemas)
export type StfTestVector = z.infer<typeof StfTestVectorSchema>;
export type Jip4Chainspec = z.infer<typeof Jip4ChainspecSchema>;
export type TypeberryConfig = z.infer<typeof TypeberryConfigSchema>;
export type StfGenesis = z.infer<typeof StfGenesisSchema>;
export type RawStateFile = z.infer<typeof RawStateFileSchema>;

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
  } else {
    console.warn('(try) STF test vector', stfTestVectorResult.error);
  }

  // Try Typeberry Config
  const typeberryResult = TypeberryConfigSchema.safeParse(parsedJson);
  if (typeberryResult.success) {
    return {
      format: 'typeberry-config',
      description: 'Typeberry Config - contains JIP-4 chainspec in chain_spec field',
      data: typeberryResult.data,
    };
  } else {
    console.warn('(try) Typeberry config', typeberryResult.error);
  }

  // Try STF Genesis
  const stfGenesisResult = StfGenesisSchema.safeParse(parsedJson);
  if (stfGenesisResult.success) {
    return {
      format: 'stf-genesis',
      description: 'STF Genesis - contains initial state with header',
      data: stfGenesisResult.data,
    };
  } else {
    console.warn('(try) STF Genesis', stfGenesisResult.error);
  }

  // Try JIP-4 Chainspec
  const jip4Result = Jip4ChainspecSchema.safeParse(parsedJson);
  if (jip4Result.success) {
    return {
      format: 'jip4-chainspec',
      description: 'JIP-4 Chainspec - contains genesis_state directly',
      data: jip4Result.data,
    };
  } else {
    console.warn('(try) JIP 4 chainspec', jip4Result.error);
  }

  // Try raw state
  const rawStateResult = RawStateFileSchema.safeParse(parsedJson);
  if (rawStateResult.success) {
    return {
      format: 'state',
      description: 'Raw state entries',
      data: rawStateResult.data,
    };
  } else {
    console.warn('(try) RAW state file', rawStateResult.error);
  }

  return { format: 'unknown', description: 'Unknown format - does not match any supported schema' };
};

/**
 * Validates an already-parsed JSON object
 * Used when JSON is already parsed (e.g., from binary conversion)
 *
 * @param parsedJson - The parsed JSON object
 * @returns JsonValidationResult
 */
const validateParsedJson = (parsedJson: unknown): Omit<JsonValidationResult, 'content'> => {

  const parsedJsonFixCase = convertCamelCaseToSnake(parsedJson);
  const { format, description } = detectJsonFormat(parsedJsonFixCase);

  let availableStates: StfStateType[] = ['post_state'];

  if (format === 'stf-test-vector') {
    availableStates = ['pre_state', 'post_state', 'diff'];
  }

  if (format === 'unknown') {
    return {
      isValid: false,
      error: `Unsupported JSON format. ${description}. Please upload a JIP-4 chainspec, Typeberry config, STF test vector, or STF genesis file.`,
      format,
      formatDescription: description,
      availableStates: [],
    };
  } else {
    return {
      isValid: true,
      error: null,
      format,
      formatDescription: description,
      availableStates,
    };
  }
};

export const validateJsonContent = (content: string): JsonValidationResult => {
  try {
    const parsedJson = JSON.parse(content);
    const result = validateParsedJson(parsedJson);

    return {
      content,
      ...result,
    };
  } catch {
    return {
      content,
      isValid: false,
      error: 'Invalid JSON format. Please check your content and try again.',
      format: 'unknown',
      formatDescription: 'Malformed JSON',
      availableStates: [],
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
        availableStates: [],
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
          availableStates: [],
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
        availableStates: [],
      });
    };
    reader.readAsText(file);
  });
};


const extractStateFromStfVector = (
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

const addHexPrefix = (state: Record<string, string>): Record<string, string> => {
  const prefixedState: Record<string, string> = {};
  for (const [key, value] of Object.entries(state)) {
    const prefixedKey = key.startsWith('0x') ? key : `0x${key}`;
    const prefixedValue = value.startsWith('0x') ? value : `0x${value}`;
    prefixedState[prefixedKey] = prefixedValue;
  }
  return prefixedState;
};

export const extractInputData = (
  content: string,
  format: JsonFileFormat,
): {
  state: RawState | null,
  preState?: RawState,
  block?: unknown,
} => {
  try {
    const parsedJson = JSON.parse(content);

    switch (format) {
      case 'jip4-chainspec': {
        const result = Jip4ChainspecSchema.safeParse(parsedJson);
        return { state: result.success ? addHexPrefix(result.data.genesis_state) : null };
      }

      case 'typeberry-config': {
        const result = TypeberryConfigSchema.safeParse(parsedJson);
        return {state: result.success ? addHexPrefix(result.data.chain_spec.genesis_state) : null};
      }

      case 'stf-test-vector': {
        const result = StfTestVectorSchema.safeParse(parsedJson);
        if (!result.success) return { state: null };

        const preState = extractStateFromStfVector(result.data, 'pre_state');
        const postState = extractStateFromStfVector(result.data, 'post_state');

        return {
          state: postState,
          preState,
          block: result.data.block,
        };
      }

      case 'stf-genesis': {
        const result = StfGenesisSchema.safeParse(parsedJson);
        if (!result.success) return {state: null};

        const stateMap: RawState = {};
        for (const item of result.data.state.keyvals) {
          stateMap[item.key] = item.value;
        }
        return {state: stateMap};
      }

      case 'state': {
        const result = RawStateFileSchema.safeParse(parsedJson);
        if (!result.success) return {state: null};

        const stateMap: RawState = {};
        for (const item of result.data.state) {
          stateMap[item.key] = item.value;
        }
        return {state: addHexPrefix(stateMap)};
      }

      default:
        return {state: null};
    }
  } catch (error) {
    // Re-throw intentional errors, only catch JSON parsing errors
    if (error instanceof Error && error.message === 'State type must be specified for STF test vectors') {
      throw error;
    }
    return {state: null};
  }
};

export function convertCamelCaseToSnake(parsedJson: unknown): unknown {
  if (parsedJson === null || parsedJson === undefined) {
    return parsedJson;
  }

  if (typeof parsedJson !== 'object') {
    return parsedJson;
  }

  if (Array.isArray(parsedJson)) {
    return parsedJson.map(convertCamelCaseToSnake);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsedJson)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = convertCamelCaseToSnake(value);
  }
  return result;
}
