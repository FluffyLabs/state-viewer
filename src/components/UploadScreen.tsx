import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { Upload, FileText, AlertCircle, Edit, X } from 'lucide-react';

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
  });

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'application/json': ['.json'],
    },
    multiple: false,
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
          role="button"
          aria-label="Upload JSON file by dragging and dropping or clicking to browse"
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : uploadState.error
              ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
              : uploadState.isValidJson
              ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
              : 'border-muted-foreground/25 bg-background hover:border-muted-foreground/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            {uploadState.error ? (
              <AlertCircle className="h-12 w-12 text-red-500" />
            ) : uploadState.isValidJson ? (
              <FileText className="h-12 w-12 text-green-500" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
            
            {isDragActive ? (
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                Drop the JSON file here...
              </p>
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
                  Drag & drop your JSON file here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports .json files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {uploadState.error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 dark:text-red-400">{uploadState.error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadState.isValidJson && !uploadState.error && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-500" />
                <p className="text-green-700 dark:text-green-400">
                  JSON file loaded successfully!
                </p>
              </div>
              <button
                onClick={clearUpload}
                className="text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleManualEdit}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Manual JSON Editor</span>
        </button>

        {(uploadState.file || uploadState.content) && (
          <button
            onClick={clearUpload}
            className="flex items-center space-x-2 px-6 py-3 border border-muted-foreground/25 hover:border-muted-foreground/50 text-foreground rounded-lg font-medium transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Manual Editor Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                JSON Editor
              </h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                aria-label="Close dialog"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-96 border border-border rounded-lg overflow-hidden">
                <CodeMirror
                  value={editorContent}
                  onChange={(value) => setEditorContent(value)}
                  extensions={[json()]}
                  theme={isDark ? oneDark : undefined}
                  className="h-full"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                  }}
                />
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-border">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 border border-muted-foreground/25 hover:border-muted-foreground/50 text-foreground rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Save JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Preview (if valid JSON is loaded) */}
      {uploadState.isValidJson && uploadState.content && !isDialogOpen && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            JSON Preview
          </h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <CodeMirror
              value={uploadState.content}
              editable={false}
              extensions={[json()]}
              theme={isDark ? oneDark : undefined}
              className="max-h-96"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadScreen;