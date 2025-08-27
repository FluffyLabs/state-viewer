import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Edit, FolderOpen } from 'lucide-react';
import JsonEditorDialog from './JsonEditorDialog';
import StateViewer from './StateViewer';
import { Button } from './ui/Button';
import { validateJsonFile, validateJsonContent, extractGenesisState, type JsonFileFormat, type StfStateType, type JsonValidationResult } from '../utils';

import stfTestVectorFixture from '../utils/fixtures/00000001.json';
import jip4ChainspecFixture from '../utils/fixtures/dev-tiny.json';
import stfGenesisFixture from '../utils/fixtures/genesis.json';
import typeberryConfigFixture from '../utils/fixtures/typeberry-dev.json';

const SESSION_STORAGE_KEY = 'LAST_LOADED_FILE';

interface StoredFileData {
  content: string;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates?: StfStateType[];
  selectedState?: StfStateType;
}

interface UploadState {
  file: File | null;
  content: string;
  error: string | null;
  isValidJson: boolean;
  format: JsonFileFormat;
  formatDescription: string;
  availableStates?: StfStateType[];
  selectedState?: StfStateType;
}

interface ExampleFile {
  name: string;
  description: string;
  content: string;
}

const EXAMPLE_FILES: ExampleFile[] = [
  {
    name: 'STF Test Vector',
    description: 'Example with pre-state and post-state data',
    content: JSON.stringify(stfTestVectorFixture, null, 2)
  },
  {
    name: 'JIP-4 Chain Spec',
    description: 'Genesis state from chain specification',
    content: JSON.stringify(jip4ChainspecFixture, null, 2)
  },
  {
    name: 'STF Genesis',
    description: 'Initial state with header information',
    content: JSON.stringify(stfGenesisFixture, null, 2)
  },
  {
    name: 'Typeberry Config',
    description: 'Typeberry framework configuration',
    content: JSON.stringify(typeberryConfigFixture, null, 2)
  }
];

const UploadScreen = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    content: '',
    error: null,
    isValidJson: false,
    format: 'unknown',
    formatDescription: '',
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

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

  const stateTitle = useMemo(() => {
    if (uploadState.format === 'stf-test-vector' && uploadState.selectedState) {
      if (uploadState.selectedState === 'pre_state') {
        return 'Pre-State Data';
      } else if (uploadState.selectedState === 'post_state') {
        return 'Post-State Data';
      } else if (uploadState.selectedState === 'diff') {
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
  }, [uploadState.format, uploadState.selectedState]);



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

  const handleUploadStateWithStorage = useCallback((
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
        selectedState: validation.availableStates?.includes('diff') ? 'diff' : validation.availableStates?.[0],
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToStore));
    }
  }, []);

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    clearUpload();
    const file = acceptedFiles[0];
    if (!file) return;

    const validation = await validateJsonFile(file);

    const newUploadState = {
      file,
      content: validation.content,
      error: validation.error,
      isValidJson: validation.isValid,
      format: validation.format,
      formatDescription: validation.formatDescription,
      availableStates: validation.availableStates,
      selectedState: validation.availableStates?.includes('diff') ? 'diff' : validation.availableStates?.[0],
    };

    handleUploadStateWithStorage(newUploadState, validation);
  }, [clearUpload, handleUploadStateWithStorage]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'application/json': ['.json'],
    },
    multiple: false,
    noClick: true, // Disable click on the dropzone area itself
  });

  const handleManualEdit = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleSaveManualEdit = useCallback((content: string) => {
    const validateManualContent = async () => {
      const validation = validateJsonContent(content);

      if (validation.isValid && validation.format === 'unknown') {
        setFormatError('The JSON is valid but does not match any of the known formats (JIP-4 Chain Spec, STF Test Vector, STF Genesis).');
      } else {
        setFormatError(null);
        setIsDialogOpen(false);
      }

      handleUploadStateWithStorage(prev => ({
        ...prev,
        content: validation.content,
        error: validation.error,
        isValidJson: validation.isValid,
        file: null,
        format: validation.format,
        formatDescription: validation.formatDescription,
        availableStates: validation.availableStates,
        selectedState: validation.availableStates?.includes('diff') ? 'diff' : validation.availableStates?.[0],
      }), validation);
    };

    validateManualContent();
  }, [handleUploadStateWithStorage]);

  const handleStateSelection = useCallback((stateType: StfStateType) => {
    setUploadState(prev => ({
      ...prev,
      selectedState: stateType,
    }));
  }, []);

  const handleExampleLoad = useCallback((exampleContent: string) => {
    clearUpload();
    
    const validation = validateJsonContent(exampleContent);
    
    const newUploadState = {
      file: null,
      content: validation.content,
      error: validation.error,
      isValidJson: validation.isValid,
      format: validation.format,
      formatDescription: validation.formatDescription,
      availableStates: validation.availableStates,
      selectedState: validation.availableStates?.includes('diff') ? 'diff' : validation.availableStates?.[0],
    };

    handleUploadStateWithStorage(newUploadState, validation);
  }, [clearUpload, handleUploadStateWithStorage]);

  useEffect(() => {
    const loadFromSessionStorage = () => {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const data: StoredFileData = JSON.parse(stored);
          const validation = validateJsonContent(data.content);
          if (validation.isValid && validation.format === data.format) {
            setUploadState({
              file: null,
              content: data.content,
              error: null,
              isValidJson: true,
              format: data.format,
              formatDescription: data.formatDescription,
              availableStates: data.availableStates,
              selectedState: data.selectedState,
            });
          } else {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    };
    
    loadFromSessionStorage();
  }, []);

  const selectedState= useMemo(() => {
    if (extractedState === null) {
      return null;
    }
    if (uploadState.selectedState === 'diff') {
      return extractedState;
    }
    if (uploadState.selectedState === 'pre_state' && extractedState.preState !== undefined) {
      return { state: extractedState.preState, preState: undefined };
    }
    if (uploadState.selectedState === 'post_state') {
      return { state: extractedState.state, preState: undefined };
    }
    return extractedState;
  }, [uploadState.selectedState, extractedState]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {uploadState.content === '' && (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          JAM State Viewer
        </h1>
        <p className="text-muted-foreground">
          Upload a serialized state dump to inspect it or try loading one of the examples:{' '}
          <button
            onClick={() => handleExampleLoad(EXAMPLE_FILES[0].content)}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[0].description}
          >
            STF Test Vector
          </button>
          ,{' '}
          <button
            onClick={() => handleExampleLoad(EXAMPLE_FILES[2].content)}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[2].description}
          >
            STF Genesis
          </button>
          ,{' '}
          <button
            onClick={() => handleExampleLoad(EXAMPLE_FILES[1].content)}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[1].description}
          >
            JIP-4 Chain Spec
          </button>
          ,{' '}
          <button
            onClick={() => handleExampleLoad(EXAMPLE_FILES[3].content)}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[3].description}
          >
            Typeberry config
          </button>
        </p>
      </div>
      )}

      {/* Upload Area */}
      <div className="mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-left transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : uploadState.error
              ? 'border-destructive bg-destructive/5'
              : uploadState.isValidJson
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 bg-muted/5 hover:border-muted-foreground/50 hover:bg-muted/10'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {uploadState.error ? (
              <AlertCircle className="h-12 w-12 text-destructive" />
            ) : uploadState.isValidJson ? (
              <FileText className="h-12 w-12 text-primary" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}

            <div className="flex-1">
            {isDragActive ? (
              <div className="space-y-2">
                <p className="text-primary font-medium">
                  Drop the JSON file here...
                </p>
                <p className="text-sm text-muted-foreground">&nbsp;</p>
              </div>
            ) : uploadState.file ? (
              <div className="space-y-2">
                <p className="text-foreground font-medium">{uploadState.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadState.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">
                    Drag & drop your state JSON here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports STF test vectors, STF genesis, and JIP-4 Chain Spec.
                  </p>
                </div>
            )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              {/* Browse Button (if no file uploaded) */}
                <Button
                  onClick={open}
                  variant="primary"
                  size="lg"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>{(!uploadState.file && !uploadState.content) ? 'Upload' : 'Change'}</span>
                </Button>

              <Button
                onClick={handleManualEdit}
                variant="secondary"
                size="lg"
              >
                <Edit className="h-4 w-4" />
                <span>{(!uploadState.file && !uploadState.content) ? 'JSON' : 'Edit'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {uploadState.error && (
          <div className="text-left mt-4 px-6 py-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{uploadState.error}</p>
            </div>
          </div>
        )}

        {/* Success Message with Format Detection */}
        {uploadState.isValidJson && !uploadState.error && (
          <div className="mt-4 space-y-4 text-left">
            <div className="px-6 py-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-success font-medium">
                      JSON file loaded successfully!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detected format: {uploadState.formatDescription}
                    </p>
                  </div>
                </div>

                {/* State Selection for STF Test Vectors */}
                {uploadState.availableStates && uploadState.availableStates.length > 0 && (
                  <div className="ml-4">
                    <div className="flex gap-2 flex-wrap">
                      {uploadState.availableStates.map((stateType) => (
                        <Button
                          key={stateType}
                          onClick={() => handleStateSelection(stateType)}
                          variant={uploadState.selectedState === stateType ? "primary" : "secondary"}
                          size="sm"
                        >
                          {stateType === 'pre_state' ? 'Pre-State' :
                           stateType === 'post_state' ? 'Post-State' : 'Diff'}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* State Viewer */}
      {selectedState !== null && Object.keys(selectedState.state).length > 0 && (
        <div className="mb-6">
          <StateViewer
            state={selectedState.state}
            preState={selectedState.preState}
            title={stateTitle}
          />
        </div>
      )}

      {/* JSON Editor Dialog */}
      <JsonEditorDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setFormatError(null);
        }}
        onSave={handleSaveManualEdit}
        onReset={clearUpload}
        initialContent={uploadState.content || '{\n  \n}'}
        formatError={formatError}
      />
    </div>
  );
};

export default UploadScreen;
