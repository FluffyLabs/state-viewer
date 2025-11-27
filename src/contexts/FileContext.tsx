import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from "react";
import { extractGenesisState, JsonValidationResult } from "@/utils";
import type { UploadState, StoredFileData, ExtractedState, StfStateType, RawState } from "@/types/shared";
import { clearStoredFileData, getSessionStoredFileData, hasIndexedDbStoredFile, loadStoredFileData, saveStoredFileData } from "@/utils/fileStorage";

interface FileContextType {
  // State
  uploadState: UploadState;
  extractedState: ExtractedState | null;
  stateTitle: (selectedState: StfStateType) => string;
  isRestoring: boolean;
  executionLog: string[];
  showPvmLogs: boolean;

  // Actions
  updateUploadState: (
    newState: UploadState | ((prev: UploadState) => UploadState),
    validation?: JsonValidationResult
  ) => void;
  setExecutedState: (state: RawState) => void;
  setExecutionLog: (log: string[]) => void;
  setShowPvmLogs: (show: boolean) => void;
  clearUpload: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

interface FileProviderProps {
  children: ReactNode;
}

const createEmptyUploadState = (): UploadState => ({
  file: null,
  content: '',
  error: null,
  isValidJson: false,
  format: 'unknown',
  formatDescription: '',
  availableStates: undefined,
  fileName: undefined,
});

const storedFileDataToUploadState = (data: StoredFileData): UploadState => ({
  file: null,
  content: data.content,
  error: null,
  isValidJson: true,
  format: data.format,
  formatDescription: data.formatDescription,
  availableStates: data.availableStates,
  fileName: data.fileName,
});

export const FileProvider = ({ children }: FileProviderProps) => {
  const [executedState, setExecutedState] = useState<RawState>();
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [showPvmLogs, setShowPvmLogs] = useState<boolean>(() => {
    const stored = localStorage.getItem('SHOW_PVM_LOGS');
    return stored === null ? false : stored === 'true';
  });
  const [uploadState, setUploadState] = useState<UploadState>(() => {
    const stored = getSessionStoredFileData();
    return stored ? storedFileDataToUploadState(stored) : createEmptyUploadState();
  });
  const [isRestoring, setIsRestoring] = useState<boolean>(() => {
    return getSessionStoredFileData() ? false : hasIndexedDbStoredFile();
  });

  useEffect(() => {
    if (getSessionStoredFileData() || !hasIndexedDbStoredFile()) {
      return;
    }

    let isMounted = true;

    const restoreState = async () => {
      const data = await loadStoredFileData();
      if (!isMounted) {
        return;
      }

      if (data) {
        setUploadState(storedFileDataToUploadState(data));
      }

      setIsRestoring(false);
    };

    void restoreState();

    return () => {
      isMounted = false;
    };
  }, []);

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
      return state.state === null ? null : { state: state.state, preState: state.preState, block: state.block }
    } catch (error) {
      console.error('Failed to extract state:', error);
      return null;
    }
  }, [uploadState.content, uploadState.format, uploadState.isValidJson]);

  const extractedAndExecuted = useMemo(() => {
    if (extractedState === null) {
      return null;
    }

    return { executedState, ...extractedState };
  }, [extractedState, executedState]);


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
        fileName: validation.fileName,
      };
      void saveStoredFileData(dataToStore);
    }
  }, []);

  const clearUpload = useCallback(() => {
    setUploadState(createEmptyUploadState());
    setExecutedState(undefined);
    setExecutionLog([]);
    clearStoredFileData();
  }, []);

  const handleSetShowPvmLogs = useCallback((show: boolean) => {
    setShowPvmLogs(show);
    localStorage.setItem('SHOW_PVM_LOGS', String(show));
  }, []);

  const value = {
    uploadState,
    extractedState: extractedAndExecuted,
    stateTitle,
    updateUploadState,
    setExecutedState,
    executionLog,
    setExecutionLog,
    showPvmLogs,
    setShowPvmLogs: handleSetShowPvmLogs,
    clearUpload,
    isRestoring,
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
