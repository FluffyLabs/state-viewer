import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

export type JsonEditorProps = {
  editorContent: string;
  onContentChange: (content: string) => void;
  isDark: boolean;
};

export default function JsonEditor(
  { editorContent, onContentChange: handleContentChange, isDark }: JsonEditorProps
) {
  return (
    <CodeMirror
      value={editorContent}
      onChange={handleContentChange}
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
  );
}
