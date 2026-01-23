import { useState, useCallback, useMemo, type MouseEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Edit, FolderOpen, X } from 'lucide-react';
import JsonEditorDialog from './JsonEditorDialog';
import { validateFile, validateJsonContent, type JsonValidationResult, getChainSpec } from '../utils';
import * as block from '@typeberry/lib/block';
import * as block_json from '@typeberry/lib/block-json';
import * as bytes from '@typeberry/lib/bytes';
import * as config from '@typeberry/lib/config';
import * as crypto from '@typeberry/lib/crypto';
import * as json_parser from '@typeberry/lib/json-parser';
import * as logger from '@typeberry/lib/logger';
import * as state_merkleization from '@typeberry/lib/state-merkleization';
import * as transition from '@typeberry/lib/transition';
import * as utils from '@typeberry/lib/utils';

import ExamplesModal from '@/trie/components/ExamplesModal';
import type { AppState, RawState, StfStateType, UploadState } from '@/types/shared';
import {StateKindSelector} from './StateKindSelector';
import {Button} from '@fluffylabs/shared-ui';

void crypto.initWasm();

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
  onSetExecutedState: (state: RawState) => void;
  onClearUpload: () => void;
  changeStateType: (type: StfStateType) => void;
  onSetExecutionLog: (log: string[]) => void;
  showPvmLogs: boolean;
}

export const UploadScreen = ({
  appState,
  onUpdateUploadState,
  onSetExecutedState,
  onClearUpload,
  changeStateType,
  onSetExecutionLog,
  showPvmLogs,
}: UploadScreenProps) => {
  const { uploadState, selectedState, extractedState, isRestoring } = appState;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningBlock, setIsRunningBlock] = useState(false);
  const executedState = extractedState?.executedState;
  const displayFileName = uploadState.file?.name ?? uploadState.fileName ?? null;
  const displayFileSize = uploadState.file ? `${(uploadState.file.size / 1024).toFixed(1)} KB` : null;
  const isUiBlocked = isLoading || isRestoring;
  
  const stateBlock = useMemo(() => {
    const block = extractedState?.block;
    if (block === undefined) {
      return undefined;
    }
    try {
      return json_parser.parseFromJson(block, block_json.blockFromJson(getChainSpec()));
    } catch (e) {
      console.warn('Unable to parse state block', e);
      return undefined;
    }
  }, [extractedState]);

  const clearUpload = useCallback(() => {
    if (isRestoring) {
      return;
    }
    onClearUpload();
  }, [onClearUpload, isRestoring]);

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
    const validationWithName = { ...validation, fileName: file.name };

    const newUploadState = {
      file,
      content: validation.content,
      error: validation.error,
      isValidJson: validation.isValid,
      format: validation.format,
      formatDescription: validation.formatDescription,
      availableStates: validation.availableStates,
      selectedState: validation.availableStates?.includes('diff') ? 'diff' : validation.availableStates?.[0],
      fileName: file.name,
    };

    handleUploadStateWithStorage(newUploadState, validationWithName);
  }, [clearUpload, handleUploadStateWithStorage]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'application/json': ['.json'],
      'application/octet-stream': ['.bin'],
    },
    multiple: false,
    noClick: true, // Disable click on the dropzone area itself
    disabled: isUiBlocked,
  });

  const handleOpenFileDialog = useCallback(() => {
    if (isLoading || isRestoring) {
      return;
    }
    open();
  }, [isLoading, isRestoring, open]);

  const handleManualEdit = useCallback(() => {
    if (isUiBlocked) {
      return;
    }
    setIsDialogOpen(true);
  }, [isUiBlocked]);

  const handleSaveManualEdit = useCallback((content: string) => {
    const validateManualContent = async () => {
      const validation = validateJsonContent(content);
      const derivedFileName = uploadState.file?.name ?? uploadState.fileName;
      const validationWithName = { ...validation, fileName: derivedFileName };

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
        fileName: derivedFileName,
      }), validationWithName);
    };

    validateManualContent();
  }, [handleUploadStateWithStorage, uploadState.file, uploadState.fileName]);

  const handleClearUploadedFile = useCallback((event?: MouseEvent) => {
    event?.stopPropagation();
    clearUpload();
  }, [clearUpload]);

  const handleExampleLoad = useCallback(async (example: Pick<ExampleFile, 'name' | 'content'>) => {
    if (isUiBlocked) {
      return;
    }
    clearUpload();
    setIsLoading(true);
    let content = '';
    try {
      content = await example.content();
    } finally {
      setIsLoading(false);
    }

    const validation = validateJsonContent(content);
    const validationWithName = { ...validation, fileName: example.name };

    const newUploadState = {
      file: null,
      content: validation.content,
      error: validation.error,
      isValidJson: validation.isValid,
      format: validation.format,
      formatDescription: validation.formatDescription,
      availableStates: validation.availableStates,
      selectedState: validation.availableStates?.includes('diff') ? 'diff' : validation.availableStates?.[0],
      fileName: example.name,
    };

    handleUploadStateWithStorage(newUploadState, validationWithName);
  }, [clearUpload, handleUploadStateWithStorage, isUiBlocked]);

  async function runBlock(stateBlock: block.Block): Promise<void> {
    if (isRunningBlock) {
      return;
    }

    setIsRunningBlock(true);
    const logBuffer: string[] = [];

    const originalConsoleInfo = console.info;
    console.info = (...args: Parameters<typeof console.info>) => {
      const serialized = args.map((arg) => String(arg)).join(' ');
      logBuffer.push(serialized);
      originalConsoleInfo(...args);
    };

    logger.Logger.configureAllFromOptions({
      defaultLevel: logger.Level.TRACE,
      // TODO [todr] due to a bug in typeberry we need to pad the module name here.
      // this should be fixed in next release so make sure to update it here as well.
      modules: showPvmLogs ? new Map([["     pvm", logger.Level.INSANE], ["pvm", logger.Level.INSANE]]) : new Map(),
      workingDir: '/',
    });

    try {
      const hasher = await transition.TransitionHasher.create();
      const spec = getChainSpec();
      const preState = extractedState?.preState;
      const entries = state_merkleization.StateEntries.fromEntriesUnsafe(
        Object.entries(preState ?? {}).map(([key, val]) => ([bytes.Bytes.parseBytes(key, 31),  bytes.BytesBlob.parseBlob(val)]))
      );
      const state = state_merkleization.SerializedState.fromStateEntries(spec, hasher.blake2b, entries);
      const stf = new transition.OnChain(spec, state, hasher, config.PvmBackend.BuiltIn, {
        isAncestor(): boolean {
          return true;
        }
      });
      const blockView = block.reencodeAsView(block.Block.Codec, stateBlock, spec);
      const headerHash = stf.hasher.header(blockView.header.view());
      const res = await stf.transition(blockView, headerHash.hash);
      if (res.isOk) {
        console.info('Block imported correctly!');
        state.backend.applyUpdate(state_merkleization.serializeStateUpdate(spec, hasher.blake2b, res.ok));
        const stateEntries = Array.from(state.backend);
        onSetExecutedState(Object.fromEntries(
          stateEntries.map(([h, b]) => [h.toString(), b.toString()])
        ));
        changeStateType('exec_diff');
      } else {
        console.info(`Error: ${utils.resultToString(res)}`);
      }
    } catch (error) {
      console.info(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      console.info = originalConsoleInfo;
      setIsRunningBlock(false);
      onSetExecutionLog(logBuffer);
    }
  }

  return (
    <div className="relative" aria-busy={isRestoring}>
      <div className={isRestoring ? "pointer-events-none opacity-60" : undefined}>
      {uploadState.content === '' && (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          JAM State Viewer
        </h1>
        <p className="text-muted-foreground">
          Upload a serialized state dump to inspect it or try loading one of the examples:{' '}
          <button
            disabled={isUiBlocked}
            onClick={() => handleExampleLoad(EXAMPLE_FILES[0])}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[0].description}
          >
            STF Test Vector
          </button>
          ,{' '}
          <button
            disabled={isUiBlocked}
            onClick={() => handleExampleLoad(EXAMPLE_FILES[2])}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[2].description}
          >
            STF Genesis
          </button>
          ,{' '}
          <button
            disabled={isUiBlocked}
            onClick={() => handleExampleLoad(EXAMPLE_FILES[1])}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[1].description}
          >
            JIP-4 Chain Spec
          </button>
          ,{' '}
          <button
            disabled={isUiBlocked}
            onClick={() => handleExampleLoad(EXAMPLE_FILES[3])}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
            title={EXAMPLE_FILES[3].description}
          >
            Typeberry config
          </button>
        </p>
        <p className="text-muted-foreground">
          Instead of loading full JAM state you can also try out&nbsp;
          <ExamplesModal
            onSelect={(rows) => handleExampleLoad({
              name: 'Trie Example',
              content: async () => JSON.stringify({ state: rows }, null, 2),
            })}
            button={(openExamples) => (
              <button
                disabled={isUiBlocked}
                onClick={() => {
                  if (!isUiBlocked) {
                    openExamples();
                  }
                }}
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
            ) : displayFileName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-medium">{displayFileName}</p>
                  <button
                    type="button"
                    onClick={handleClearUploadedFile}
                    disabled={isUiBlocked}
                    aria-label="Clear uploaded file"
                    className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {displayFileSize && (
                  <p className="text-sm text-muted-foreground">
                    {displayFileSize}
                  </p>
                )}
              </div>
            ) : isLoading ? (
              <div className="space-y-2">
                Loading example...
              </div>
            ) : isRestoring ? (
              <div className="space-y-2">
                Restoring previous upload...
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
            {!isUiBlocked && (
              <div className="flex flex-wrap gap-3 justify-center">
                {/* Browse Button (if no file uploaded) */}
                  <Button
                    onClick={handleOpenFileDialog}
                    variant="primary"
                    size="lg"
                    disabled={isUiBlocked}
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>{(!uploadState.file && !uploadState.content) ? 'Upload' : 'Change'}</span>
                  </Button>
                
                <Button
                  onClick={handleManualEdit}
                  variant="secondary"
                  size="lg"
                  disabled={isUiBlocked}
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
                  stateBlock={stateBlock}
                  executedState={executedState}
                  runBlock={runBlock}
                  runBlockLoading={isRunningBlock}
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
      </div>
      {isRestoring && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex h-5 w-5 rounded-full border-2 border-muted-foreground border-b-transparent animate-spin" aria-hidden="true" />
            <span>Restoring previous upload...</span>
          </div>
        </div>
      )}
    </div>
  );
};
