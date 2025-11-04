import { useState, useEffect, lazy, Suspense } from 'react';
import { X, AlertCircle } from 'lucide-react';
import {Button} from '@fluffylabs/shared-ui';

const JsonEditor = lazy(() => import('./JsonEditor'));

interface JsonEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  onReset?: () => void;
  initialContent?: string;
  formatError?: string | null;
}

const JsonEditorDialog = ({
  isOpen,
  onClose,
  onSave,
  onReset,
  initialContent = '{\n  \n}',
  formatError = null,
}: JsonEditorDialogProps) => {
  const [editorContent, setEditorContent] = useState(initialContent);
  const [isDark, setIsDark] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isJsonValid, setIsJsonValid] = useState(true);

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

  // Update editor content when initialContent changes
  useEffect(() => {
    if (isOpen) {
      setEditorContent(initialContent);
      validateJson(initialContent);
    }
  }, [isOpen, initialContent]);

  // Validate JSON content
  const validateJson = (content: string) => {
    try {
      JSON.parse(content);
      setJsonError(null);
      setIsJsonValid(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
      setJsonError(errorMessage);
      setIsJsonValid(false);
    }
  };

  // Handle content changes in editor
  const handleContentChange = (value: string) => {
    setEditorContent(value);
    validateJson(value);
  };

  const handleSave = () => {
    if (!isJsonValid) {
      return; // Don't save invalid JSON
    }

    onSave(editorContent);
  };

  const handleCancel = () => {
    setEditorContent(initialContent); // Reset content
    setJsonError(null);
    setIsJsonValid(true);
    onClose();
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            JSON Editor
          </h2>
          <button
            onClick={handleCancel}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Error Only */}
        {formatError && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Format Validation Error
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                  {formatError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden min-h-0">
          <div className="h-full border border-border rounded-lg overflow-hidden">
            <Suspense fallback={<div className="font-mono p-4">Loading...</div>}>
              <JsonEditor
                editorContent={editorContent}
                onContentChange={handleContentChange}
                isDark={isDark}
              />
            </Suspense>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="p-6 border-t border-border flex flex-row justify-end">
          {/* JSON Error Message */}
          {jsonError && (
            <div className="flex items-start p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg -mt-3">
              <AlertCircle className="h-4 w-4 mr-2 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 dark:text-red-200">
                  {jsonError}
                </p>
              </div>
            </div>
          )}
          <div className="flex-1"></div>
          <div className="flex justify-end space-x-3">
            {onReset && (
              <Button
                onClick={handleReset}
                variant="secondary"
              >
                Reset
              </Button>
            )}
            <Button
              onClick={handleCancel}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={!isJsonValid}
              className={!isJsonValid ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Save JSON
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonEditorDialog;
