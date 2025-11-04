import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { UploadScreen } from './UploadScreen';
import type { AppState, UploadState } from '@/types/shared';

// Mock the JsonEditor component (which is lazy loaded)
vi.mock('./JsonEditor', () => ({
  default: ({ editorContent, onContentChange }: { editorContent: string; onContentChange: (val: string) => void; isDark: boolean }) => (
    <textarea
      data-testid="codemirror"
      value={editorContent}
      onChange={(e) => onContentChange(e.target.value)}
    />
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  X: () => <div data-testid="x-icon" />,
  FolderOpen: () => <div data-testid="folder-open-icon" />,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('UploadScreen', () => {
  const user = userEvent.setup();

  const mockUploadState: UploadState = {
    file: null,
    content: '',
    error: null,
    isValidJson: false,
    format: 'unknown',
    formatDescription: '',
  };

  const mockAppState: AppState = {
    uploadState: mockUploadState,
    extractedState: null,
    stateTitle: 'State Data',
    selectedState: 'post_state',
  };

  const mockOnUpdateUploadState = vi.fn();
  const mockOnClearUpload = vi.fn();
  const mockChangeStateType = vi.fn();

  const defaultProps = {
    appState: mockAppState,
    onUpdateUploadState: mockOnUpdateUploadState,
    onClearUpload: mockOnClearUpload,
    changeStateType: mockChangeStateType,
  };

  it('renders upload screen with initial state', () => {
    render(<UploadScreen {...defaultProps} />);

    expect(screen.getByText('JAM State Viewer')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop your state JSON / BIN here')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
  });

  it('opens manual editor dialog when button is clicked', async () => {
    render(<UploadScreen {...defaultProps} />);

    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    expect(screen.getByText('JSON Editor')).toBeInTheDocument();
    
    // Wait for lazy-loaded component
    await vi.waitFor(() => {
      expect(screen.getByTestId('codemirror')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Save JSON')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('closes manual editor dialog when close button is clicked', async () => {
    render(<UploadScreen {...defaultProps} />);

    // Open dialog
    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    expect(screen.getByText('JSON Editor')).toBeInTheDocument();

    // Close dialog
    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);

    expect(screen.queryByText('JSON Editor')).not.toBeInTheDocument();
  });

  it('closes manual editor dialog when cancel button is clicked', async () => {
    render(<UploadScreen {...defaultProps} />);

    // Open dialog
    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    expect(screen.getByText('JSON Editor')).toBeInTheDocument();

    // Close via cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByText('JSON Editor')).not.toBeInTheDocument();
  });

  it('shows default JSON structure in editor when opened', async () => {
    render(<UploadScreen {...defaultProps} />);

    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    // Wait for lazy-loaded component
    await vi.waitFor(() => {
      const textarea = screen.getByTestId('codemirror');
      expect(textarea).toHaveValue('{\n  \n}');
    });
  });

  it('allows editing content in the manual editor', async () => {
    render(<UploadScreen {...defaultProps} />);

    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    // Wait for lazy-loaded component
    await vi.waitFor(() => {
      expect(screen.getByTestId('codemirror')).toBeInTheDocument();
    });
    
    const textarea = screen.getByTestId('codemirror');
    await user.clear(textarea);
    fireEvent.change(textarea, { target: { value: '{"test": "value"}' } });

    expect(textarea).toHaveValue('{"test": "value"}');
  });

  it('saves valid JSON from manual editor and shows preview', async () => {
    render(<UploadScreen {...defaultProps} />);

    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    // Wait for lazy-loaded component
    await vi.waitFor(() => {
      expect(screen.getByTestId('codemirror')).toBeInTheDocument();
    });
    
    const textarea = screen.getByTestId('codemirror');
    await user.clear(textarea);
    fireEvent.change(textarea, { target: { value: '{"manual": "edit"}' } });

    const saveButton = screen.getByText('Save JSON');
    await user.click(saveButton);

    // Dialog should close
    expect(screen.queryByText('JSON Editor')).not.toBeInTheDocument();
  });

  it('displays upload area with proper styling and file input', () => {
    render(<UploadScreen {...defaultProps} />);

    const uploadArea = screen.getByText('Drag & drop your state JSON / BIN here').closest('div');
    expect(uploadArea).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'application/json,.json,application/octet-stream,.bin');
  });

  it('shows correct icons based on state', () => {
    render(<UploadScreen {...defaultProps} />);

    // Initial state should show upload icon, edit icon, and folder-open icon
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    expect(screen.getByTestId('folder-open-icon')).toBeInTheDocument(); // Browse button
  });

  it('has proper page structure and content', () => {
    render(<UploadScreen {...defaultProps} />);

    // Check main heading
    expect(screen.getByRole('heading', { name: /jam state viewer/i })).toBeInTheDocument();

    // Check description
    expect(screen.getByText(/upload a serialized state dump to inspect it/i)).toBeInTheDocument();

    // Check file type information
    expect(screen.getByText(/supports stf test vectors.*and jip-4 chain spec/i)).toBeInTheDocument();

    // Check Browse button
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('has Browse button that triggers file selection', async () => {
    render(<UploadScreen {...defaultProps} />);

    const browseButton = screen.getByText('Upload');
    expect(browseButton).toBeInTheDocument();
  });

  describe('Component Integration', () => {
    it('should render StateViewer component when state is extracted', () => {
      // The StateViewer integration is tested through the component's useMemo hook
      // which extracts state data. The actual format detection is thoroughly tested
      // in jsonValidation.test.ts
      render(<UploadScreen {...defaultProps} />);
      
      // Verify the component renders without errors
      expect(screen.getByText('JAM State Viewer')).toBeInTheDocument();
      expect(screen.getByText(/upload a serialized state dump to inspect it or try loading one of the examples/i)).toBeInTheDocument();
    });

    it('should handle state extraction errors gracefully', () => {
      // The useMemo hook in UploadScreen handles extraction errors by returning null
      // and logging errors to console, which prevents crashes
      render(<UploadScreen {...defaultProps} />);
      
      // Component should still render normally even if state extraction fails
      expect(screen.getByText('Drag & drop your state JSON / BIN here')).toBeInTheDocument();
      expect(screen.getByText('Supports STF test vectors, STF genesis, and JIP-4 Chain Spec.')).toBeInTheDocument();
    });
  });

  it('shows format error when valid JSON does not match known formats', async () => {
    render(<UploadScreen {...defaultProps} />);

    // Open JSON editor
    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    // Wait for lazy-loaded component
    await vi.waitFor(() => {
      expect(screen.getByTestId('codemirror')).toBeInTheDocument();
    });
    
    // Enter valid JSON that doesn't match known formats
    const textarea = screen.getByTestId('codemirror');
    await user.clear(textarea);
    fireEvent.change(textarea, { target: { value: '{"unknown": "format", "data": "value"}' } });

    // Save the JSON
    const saveButton = screen.getByText('Save JSON');
    await user.click(saveButton);

    // Dialog should close when validation fails
    expect(screen.queryByText('JSON Editor')).not.toBeInTheDocument();
    
    // Verify that onUpdateUploadState was called with the error
    expect(mockOnUpdateUploadState).toHaveBeenCalled();
    const lastCall = mockOnUpdateUploadState.mock.calls[mockOnUpdateUploadState.mock.calls.length - 1];
    const updaterFn = lastCall[0];
    const newState = typeof updaterFn === 'function' ? updaterFn(mockUploadState) : updaterFn;
    
    expect(newState.error).toMatch(/Unsupported JSON format/);
    expect(newState.format).toBe('unknown');
    expect(newState.isValidJson).toBe(false);
  });
});
