import type { JsonFileFormat, StfStateType, JsonValidationResult } from '@/utils';

export interface UploadState {
  file: File | null;
  content: string;
  error: string | null;
  isValidJson: boolean;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates?: StfStateType[];
  selectedState?: StfStateType;
}

export interface AppState {
  uploadState: UploadState;
  extractedState: { state: Record<string, string>; preState?: Record<string, string> } | null;
  stateTitle: string;
}

export interface StoredFileData {
  content: string;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates?: StfStateType[];
  selectedState?: StfStateType;
}

export interface UploadScreenProps {
  appState: AppState;
  onUpdateUploadState: (
    newState: UploadState | ((prev: UploadState) => UploadState),
    validation?: JsonValidationResult
  ) => void;
  onClearUpload: () => void;
}