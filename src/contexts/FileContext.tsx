import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import { extractGenesisState, JsonValidationResult, JsonFileFormat, StfStateType } from "@/utils";
import type { UploadState, StoredFileData } from "@/types/shared";
import {RawState} from "@/components/service";

const SESSION_STORAGE_KEY = 'state-view-file-data';



interface FileContextType {
  // State
  uploadState: UploadState;
  extractedState: { state: RawState; preState?: RawState } | null;
  stateTitle: (selectedState: StfStateType) => string;
  
  // Actions
  updateUploadState: (
    newState: UploadState | ((prev: UploadState) => UploadState),
    validation?: JsonValidationResult
  ) => void;
  clearUpload: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider = ({ children }: FileProviderProps) => {
  const [uploadState, setUploadState] = useState<UploadState>(() => {
    // Try to restore from session storage
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const data: StoredFileData = JSON.parse(stored);
        return {
          file: null,
          content: data.content,
          error: null,
          isValidJson: true,
          format: data.format as JsonFileFormat,
          formatDescription: data.formatDescription,
          availableStates: data.availableStates,
        };
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    return {
      file: null,
      content: '',
      error: null,
      isValidJson: false,
      format: 'unknown',
      formatDescription: '',
    };
  });

  // Extract state data based on format and selected state
  const extractedState = useMemo(() => {
    if (!uploadState.isValidJson || !uploadState.content) {
      return null;
    }

    try {
      const state = extractGenesisState(
        uploadState.content,
        uploadState.format,
      );
      return state.state === null ? null : { state: state.state, preState: state.preState }
    } catch (error) {
      console.error('Failed to extract state:', error);
      return null;
    }
  }, [uploadState.content, uploadState.format, uploadState.isValidJson]);

  const stateTitle = useCallback((selectedState: StfStateType) => {
    if (uploadState.format === 'stf-test-vector' && selectedState) {
      if (selectedState === 'pre_state') {
        return 'Pre-State Data';
      } else if (selectedState === 'post_state') {
        return 'Post-State Data';
      } else if (selectedState === 'diff') {
        return 'State Diff (Pre → Post)';
      }
    } else if (uploadState.format === 'jip4-chainspec') {
      return 'JIP-4 Genesis State';
    } else if (uploadState.format === 'typeberry-config') {
      return 'Typeberry Genesis State';
    } else if (uploadState.format === 'stf-genesis') {
      return 'STF Genesis State';
    }
    return 'State Data';
  }, [uploadState.format]);

  const updateUploadState = useCallback((
    newState: UploadState | ((prev: UploadState) => UploadState),
    validation?: JsonValidationResult
  ) => {
    setUploadState(newState);

    if (validation?.isValid) {
      const dataToStore: StoredFileData = {
        content: validation.content,
        format: validation.format,
        formatDescription: validation.formatDescription,
        availableStates: validation.availableStates,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToStore));
    }
  }, []);

  const clearUpload = useCallback(() => {
    setUploadState({
      file: null,
      content: '',
      error: null,
      isValidJson: false,
      format: 'unknown',
      formatDescription: '',
    });
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const value = {
    uploadState,
    extractedState,
    stateTitle,
    updateUploadState,
    clearUpload,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};
