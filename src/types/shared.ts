import type { JsonFileFormat, StfStateType } from '@/utils';

export interface UploadState {
  file: File | null;
  content: string;
  error: string | null;
  isValidJson: boolean;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates?: StfStateType[];
}

export interface AppState {
  uploadState: UploadState;
  extractedState: { state: Record<string, string>; preState?: Record<string, string> } | null;
  selectedState: StfStateType;
  stateTitle: string;
}

export interface StoredFileData {
  content: string;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates?: StfStateType[];
}
