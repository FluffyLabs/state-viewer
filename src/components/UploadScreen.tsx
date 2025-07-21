import { useState, useCallback } from 'react';

interface UploadScreenProps {
  onJsonUploaded: (content: string, format: string) => void;
}

type JsonFormat = 'state-transition-test' | 'jip4-chain-spec' | 'unknown';

const detectJsonFormat = (jsonContent: string): JsonFormat => {
  try {
    const parsed = JSON.parse(jsonContent);
    
    // Check for state transition test vector format
    if (parsed.pre_state && parsed.post_state && parsed.block) {
      return 'state-transition-test';
    }
    
    // Check for JIP-4 chain spec format
    if (parsed.name && parsed.genesis && parsed.params) {
      return 'jip4-chain-spec';
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

const UploadScreen = ({ onJsonUploaded }: UploadScreenProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileRead = useCallback((content: string) => {
    const format = detectJsonFormat(content);
    if (format === 'unknown') {
      setError('Unsupported JSON format. Please upload a state transition test vector or JIP-4 chain spec.');
      return;
    }
    
    setError(null);
    onJsonUploaded(content, format);
  }, [onJsonUploaded]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      setError('Please upload a JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleFileRead(content);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsText(file);
  }, [handleFileRead]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 1) {
      handleFileUpload(files[0]);
    } else {
      setError('Please upload only one file.');
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleJsonSubmit = useCallback(() => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON content.');
      return;
    }
    
    handleFileRead(jsonInput);
  }, [jsonInput, handleFileRead]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">State View</h1>
        <p className="text-gray-300">
          Upload or paste JSON content to visualize state transitions and chain specifications
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* File Upload */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Upload File</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              <div>
                <p className="text-gray-300 mb-2">
                  Drag and drop your JSON file here, or
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer transition-colors">
                    Browse Files
                  </span>
                </label>
              </div>
              <p className="text-sm text-gray-400">
                Supported formats: State Transition Test Vector, JIP-4 Chain Spec
              </p>
            </div>
          </div>
        </div>

        {/* Manual Input */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Paste JSON</h2>
          <div className="space-y-4">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON content here..."
              className="w-full h-64 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleJsonSubmit}
              disabled={!jsonInput.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
            >
              Process JSON
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-400">
        <p>Supported formats will be automatically detected</p>
      </div>
    </div>
  );
};

export default UploadScreen;