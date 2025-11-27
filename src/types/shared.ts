export type JsonFileFormat = 'jip4-chainspec' | 'typeberry-config' | 'stf-test-vector' | 'stf-genesis' | 'state' | 'unknown';

export type StfStateType = 'pre_state' | 'post_state' | 'diff' | 'exec_diff';

export type RawState = Record<string, string>;

export type ExtractedState = { 
  state: RawState; 
  preState?: RawState;
  executedState?: RawState;
  block?: unknown;
};

export interface UploadState {
  file: File | null;
  content: string;
  error: string | null;
  isValidJson: boolean;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates?: StfStateType[];
  fileName?: string;
}

export interface AppState {
  uploadState: UploadState;
  extractedState: ExtractedState | null;
  selectedState: StfStateType;
  stateTitle: string;
  isRestoring: boolean;
}

export interface StoredFileData {
  content: string;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates?: StfStateType[];
  fileName?: string;
}
