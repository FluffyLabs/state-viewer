import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Edit, FolderOpen } from 'lucide-react';
import JsonEditorDialog from './JsonEditorDialog';
import { validateFile, validateJsonContent, type JsonValidationResult, StfStateType } from '../utils';

import ExamplesModal from '@/trie/components/ExamplesModal';
import type { AppState, UploadState } from '@/types/shared';
import {StateKindSelector} from './StateKindSelector';
import {Button} from '@fluffylabs/shared-ui';

interface ExampleFile {
  name: string;
  description: string;
  content: () => Promise<string>;
}

const EXAMPLE_FILES: ExampleFile[] = [
  {
    name: 'STF Test Vector',
    description: 'Example with pre-state and post-state data',
    content: async () => JSON.stringify(await import('../utils/fixtures/00000041.json'), null, 2),
  },
  {
    name: 'JIP-4 Chain Spec',
    description: 'Genesis state from chain specification',
    content: async () => JSON.stringify(await import('../utils/fixtures/dev-tiny.json'), null, 2)
  },
  {
    name: 'STF Genesis',
    description: 'Initial state with header information',
    content: async () => JSON.stringify(await import('../utils/fixtures/genesis.json'), null, 2)
  },
  {
    name: 'Typeberry Config',
    description: 'Typeberry framework configuration',
    content: async () => JSON.stringify(await import('../utils/fixtures/typeberry-dev.json'), null, 2),
  }
];

export interface UploadScreenProps {
  appState: AppState;
  onUpdateUploadState: (
    newState: UploadState | ((prev: UploadState) => UploadState),
    validation?: JsonValidationResult
  ) => void;
  onClearUpload: () => void;
  changeStateType: (type: StfStateType) => void;
}

export const UploadScreen = ({
  appState,
  onUpdateUploadState,
  onClearUpload,
  changeStateType,
}: UploadScreenProps) => {
  const { uploadState, selectedState } = appState;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearUpload = useCallback(() => {
    onClearUpload();
  }, [onClearUpload]);

  const handleUploadStateWithStorage = useCallback((
    newState: UploadState | ((prev: UploadState) => UploadState),
    validation?: JsonValidationResult
  ) => {
    onUpdateUploadState(newState, validation);
  }, [onUpdateUploadState]);

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    clearUpload();
    const file = acceptedFiles[0];
    if (!file) return;

    const validation = await validateFile(file);

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
      'application/octet-stream': ['.bin'],
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

  const handleExampleLoad = useCallback(async (exampleContent: () => Promise<string>) => {
    clearUpload();
    setIsLoading(true);
    let content = '';
    try {
      content = await exampleContent();
    } finally {
      setIsLoading(false);
    }

    const validation = validateJsonContent(content);

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

  return (
    <>
      {uploadState.content === '' && (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          JAM State Viewer
        </h1>
        <p className="text-muted-foreground">
          Upload a serialized state dump to inspect it or try loading one of the examples:{' '}
          <button
            disabled={isLoading}
            onClick={() => handleExampleLoad(EXAMPLE_FILES[0].content)}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[0].description}
          >
            STF Test Vector
          </button>
          ,{' '}
          <button
            disabled={isLoading}
            onClick={() => handleExampleLoad(EXAMPLE_FILES[2].content)}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[2].description}
          >
            STF Genesis
          </button>
          ,{' '}
          <button
            disabled={isLoading}
            onClick={() => handleExampleLoad(EXAMPLE_FILES[1].content)}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[1].description}
          >
            JIP-4 Chain Spec
          </button>
          ,{' '}
          <button
            disabled={isLoading}
            onClick={() => handleExampleLoad(EXAMPLE_FILES[3].content)}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[3].description}
          >
            Typeberry config
          </button>
        </p>
        <p className="text-muted-foreground">
          Instead of loading full JAM state you can also try out&nbsp;
          <ExamplesModal
            onSelect={(rows) => handleExampleLoad(async () => JSON.stringify({
              state: rows
            }, null, 2))}
            button={(open) => (
              <button
                disabled={isLoading}
                onClick={open}
                  className="text-primary hover:text-primary/80 hover:underline transition-colors"
                title="open trie examples"
                >
                smaller trie examples from test vectors.
                  </button>
            )}
          />
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
            ) : isLoading ?  (
              <div className="space-y-2">
                Loading example...
              </div>
            ) : (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">
                    Drag & drop your state JSON / BIN here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports STF test vectors, STF genesis, and JIP-4 Chain Spec.
                  </p>
                </div>
            )}
            </div>

            {/* Action Buttons */}
            {!isLoading && (
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
            )}
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
                <StateKindSelector
                  availableStates={uploadState.availableStates}
                  selectedState={selectedState}
                  changeStateType={changeStateType}
                />
              </div>
            </div>
          </div>
        )}
      </div>

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
    </>
  );
};
