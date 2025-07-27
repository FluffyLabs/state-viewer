import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Edit, FolderOpen } from 'lucide-react';
import JsonEditorDialog from './JsonEditorDialog';
import { Button } from './Button';
import { validateJsonFile } from '../utils';

interface UploadState {
  file: File | null;
  content: string;
  error: string | null;
  isValidJson: boolean;
}

const UploadScreen = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    content: '',
    error: null,
    isValidJson: false,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);



  const clearUpload = useCallback(() => {
    setUploadState({
      file: null,
      content: '',
      error: null,
      isValidJson: false,
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
    setUploadState(prev => ({
      ...prev,
      content,
      error: null,
      isValidJson: true,
      file: null, // Clear file since this is manual input
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
                    Supports STF test vectors (w3f/davxy) and JIP-4 Chain Spec.
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
                  <span>{(!uploadState.file && !uploadState.content) ? 'Browse' : 'Change'}</span>
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

        {/* Success Message */}
        {uploadState.isValidJson && !uploadState.error && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <p className="text-success">
                  JSON file loaded successfully!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

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
