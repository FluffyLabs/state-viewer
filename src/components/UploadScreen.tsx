import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { Upload, FileText, AlertCircle, Edit, X, FolderOpen } from 'lucide-react';

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
  const [editorContent, setEditorContent] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode from the DOM or system preference
  useEffect(() => {
    const checkDarkMode = () => {
      const htmlElement = document.documentElement;
      const hasDarkClass = htmlElement.classList.contains('dark');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(hasDarkClass || systemPrefersDark);
    };

    checkDarkMode();
    
    // Watch for changes in dark mode
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  const validateJsonFile = useCallback((file: File): Promise<{ content: string; isValid: boolean; error: string | null }> => {
    return new Promise((resolve) => {
      if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        resolve({
          content: '',
          isValid: false,
          error: 'Please upload a valid JSON file',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content); // Validate JSON
          resolve({
            content,
            isValid: true,
            error: null,
          });
        } catch {
          resolve({
            content: e.target?.result as string || '',
            isValid: false,
            error: 'Invalid JSON format. Please check your file and try again.',
          });
        }
      };
      reader.onerror = () => {
        resolve({
          content: '',
          isValid: false,
          error: 'Failed to read the file. Please try again.',
        });
      };
      reader.readAsText(file);
    });
  }, []);

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validation = await validateJsonFile(file);
    
    setUploadState({
      file,
      content: validation.content,
      error: validation.error,
      isValidJson: validation.isValid,
    });
  }, [validateJsonFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'application/json': ['.json'],
    },
    multiple: false,
    noClick: true, // Disable click on the dropzone area itself
  });

  const handleManualEdit = () => {
    setEditorContent(uploadState.content || '{\n  \n}');
    setIsDialogOpen(true);
  };

  const handleSaveManualEdit = () => {
    try {
      JSON.parse(editorContent); // Validate JSON
      setUploadState(prev => ({
        ...prev,
        content: editorContent,
        error: null,
        isValidJson: true,
        file: null, // Clear file since this is manual input
      }));
      setIsDialogOpen(false);
    } catch {
      // Just close dialog, don't update state if JSON is invalid
      // The editor will show syntax errors
      setIsDialogOpen(false);
    }
  };

  const clearUpload = () => {
    setUploadState({
      file: null,
      content: '',
      error: null,
      isValidJson: false,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          State View JSON Analyzer
        </h1>
        <p className="text-muted-foreground">
          Upload a JSON file to analyze its structure and content, or create one manually.
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
          <div className="flex flex-col items-center space-y-6">
            {uploadState.error ? (
              <AlertCircle className="h-12 w-12 text-destructive" />
            ) : uploadState.isValidJson ? (
              <FileText className="h-12 w-12 text-primary" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
            
            {isDragActive ? (
              <div className="space-y-2">
                <p className="text-primary font-medium">
                  Drop the JSON file here...
                </p>
              </div>
            ) : uploadState.file ? (
              <div className="space-y-2">
                <p className="text-foreground font-medium">{uploadState.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadState.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-foreground font-medium">
                    Drag & drop your JSON file here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports .json files up to 10MB
                  </p>
                </div>
                
                {/* Browse Button */}
                <button
                  onClick={open}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Browse Files</span>
                </button>
              </div>
            )}
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
                <p className="text-primary">
                  JSON file loaded successfully!
                </p>
              </div>
              <button
                onClick={clearUpload}
                className="text-primary hover:text-primary/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Browse Button (if no file uploaded) */}
        {!uploadState.file && !uploadState.content && (
          <button
            onClick={open}
            className="flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Browse Files</span>
          </button>
        )}

        {/* Manual JSON Editor - More subtle */}
        <button
          onClick={handleManualEdit}
          className="flex items-center space-x-2 px-6 py-3 border border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/5 text-foreground rounded-lg font-medium transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Manual JSON Editor</span>
        </button>

        {/* Clear Button */}
        {(uploadState.file || uploadState.content) && (
          <button
            onClick={clearUpload}
            className="flex items-center space-x-2 px-6 py-3 border border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/5 text-muted-foreground hover:text-foreground rounded-lg font-medium transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Manual Editor Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                JSON Editor
              </h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                aria-label="Close dialog"
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 p-6 overflow-hidden min-h-0">
              <div className="h-full border border-border rounded-lg overflow-hidden">
                <CodeMirror
                  value={editorContent}
                  onChange={(value) => setEditorContent(value)}
                  extensions={[json()]}
                  theme={isDark ? oneDark : undefined}
                  height="500px"
                  style={{
                    fontSize: '14px',
                    textAlign: 'left',
                  }}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    searchKeymap: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-border">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 border border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/5 text-foreground rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualEdit}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
              >
                Save JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadScreen;