import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { X } from 'lucide-react';
import { Button } from './Button';

interface JsonEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent?: string;
}

const JsonEditorDialog = ({
  isOpen,
  onClose,
  onSave,
  initialContent = '{\n  \n}',
}: JsonEditorDialogProps) => {
  const [editorContent, setEditorContent] = useState(initialContent);
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

  // Update editor content when initialContent changes
  useEffect(() => {
    if (isOpen) {
      setEditorContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSave = () => {
    try {
      JSON.parse(editorContent); // Validate JSON
      onSave(editorContent);
      onClose();
    } catch {
      // Just close dialog, don't update state if JSON is invalid
      // The editor will show syntax errors
      onClose();
    }
  };

  const handleCancel = () => {
    setEditorContent(initialContent); // Reset content
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
          <Button
            onClick={handleCancel}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
          >
            Save JSON
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JsonEditorDialog;