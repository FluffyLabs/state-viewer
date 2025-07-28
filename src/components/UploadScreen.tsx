import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Edit, FolderOpen } from 'lucide-react';
import JsonEditorDialog from './JsonEditorDialog';
import StateViewer from './StateViewer';
import { Button } from './Button';
import { validateJsonFile, validateJsonContent, extractGenesisState, type JsonFileFormat, type StfStateType } from '../utils';

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

  // Extract state data based on format and selected state
  const extractedState = useMemo(() => {
    if (!uploadState.isValidJson || !uploadState.content) {
      return null;
    }

    try {
      const state = extractGenesisState(
        uploadState.content,
        uploadState.format,
        uploadState.selectedState
      );
      return state;
    } catch (error) {
      console.error('Failed to extract state:', error);
      return null;
    }
  }, [uploadState.content, uploadState.format, uploadState.selectedState, uploadState.isValidJson]);

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
  }, []);

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    clearUpload();
    const file = acceptedFiles[0];
    if (!file) return;

    const validation = await validateJsonFile(file);

    setUploadState({
      file,
      content: validation.content,
      error: validation.error,
      isValidJson: validation.isValid,
      format: validation.format,
      formatDescription: validation.formatDescription,
      availableStates: validation.availableStates,
      selectedState: validation.availableStates?.[0], // Default to first available state
    });
  }, [clearUpload]);

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
    // Re-validate the manually edited content
    const validateManualContent = async () => {
      const validation = validateJsonContent(content);

      setUploadState(prev => ({
        ...prev,
        content: validation.content,
        error: validation.error,
        isValidJson: validation.isValid,
        file: null, // Clear file since this is manual input
        format: validation.format,
        formatDescription: validation.formatDescription,
        availableStates: validation.availableStates,
        selectedState: undefined,
      }));
    };

    validateManualContent();
  }, []);

  const handleStateSelection = useCallback((stateType: StfStateType) => {
    setUploadState(prev => ({
      ...prev,
      selectedState: stateType,
    }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          JAM State Viewer
        </h1>
        <p className="text-muted-foreground">
          Upload a serialized state dump to inspect it.
        </p>
      </div>

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
          <div className="flex flex-row items-center space-x-6">
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
                <span>{(!uploadState.file && !uploadState.content) ? 'JSON' : 'View'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {uploadState.error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{uploadState.error}</p>
            </div>
          </div>
        )}

        {/* Success Message with Format Detection */}
        {uploadState.isValidJson && !uploadState.error && (
          <div className="mt-4 space-y-4 text-left">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
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
                    <div className="flex gap-2">
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
      {extractedState && Object.keys(extractedState).length > 0 && (
        <div className="mb-6">
          <StateViewer
            state={extractedState}
            title={stateTitle}
          />
        </div>
      )}

      {/* JSON Editor Dialog */}
      <JsonEditorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveManualEdit}
        initialContent={uploadState.content || '{\n  \n}'}
      />
    </div>
  );
};

export default UploadScreen;
