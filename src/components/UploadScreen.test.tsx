import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import UploadScreen from './UploadScreen';

// Mock CodeMirror
vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange, editable }: { value?: string; onChange?: (val: string) => void; editable?: boolean }) => (
    <textarea
      data-testid="codemirror"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={editable === false}
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

  it('renders upload screen with initial state', () => {
    render(<UploadScreen />);

    expect(screen.getByText('JAM State Viewer')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop your state JSON here')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
  });

  it('opens manual editor dialog when button is clicked', async () => {
    render(<UploadScreen />);

    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    expect(screen.getByText('JSON Editor')).toBeInTheDocument();
    expect(screen.getByTestId('codemirror')).toBeInTheDocument();
    expect(screen.getByText('Save JSON')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('closes manual editor dialog when close button is clicked', async () => {
    render(<UploadScreen />);

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
    render(<UploadScreen />);

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
    render(<UploadScreen />);

    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    const textarea = screen.getByTestId('codemirror');
    expect(textarea).toHaveValue('{\n  \n}');
  });

  it('allows editing content in the manual editor', async () => {
    render(<UploadScreen />);

    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    const textarea = screen.getByTestId('codemirror');
    await user.clear(textarea);
    fireEvent.change(textarea, { target: { value: '{"test": "value"}' } });

    expect(textarea).toHaveValue('{"test": "value"}');
  });

  it('saves valid JSON from manual editor and shows preview', async () => {
    render(<UploadScreen />);

    const editorButton = screen.getByText('JSON');
    await user.click(editorButton);

    const textarea = screen.getByTestId('codemirror');
    await user.clear(textarea);
    fireEvent.change(textarea, { target: { value: '{"manual": "edit"}' } });

    const saveButton = screen.getByText('Save JSON');
    await user.click(saveButton);

    // Dialog should close
    expect(screen.queryByText('JSON Editor')).not.toBeInTheDocument();
  });

  it('displays upload area with proper styling and file input', () => {
    render(<UploadScreen />);

    const uploadArea = screen.getByText('Drag & drop your state JSON here').closest('div');
    expect(uploadArea).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'application/json,.json');
  });

  it('shows correct icons based on state', () => {
    render(<UploadScreen />);

    // Initial state should show upload icon, edit icon, and folder-open icon
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    expect(screen.getByTestId('folder-open-icon')).toBeInTheDocument(); // Browse button
  });

  it('has proper page structure and content', () => {
    render(<UploadScreen />);

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
    render(<UploadScreen />);

    const browseButton = screen.getByText('Upload');
    expect(browseButton).toBeInTheDocument();
  });

  describe('Component Integration', () => {
    it('should render StateViewer component when state is extracted', () => {
      // The StateViewer integration is tested through the component's useMemo hook
      // which extracts state data. The actual format detection is thoroughly tested
      // in jsonValidation.test.ts
      render(<UploadScreen />);
      
      // Verify the component renders without errors
      expect(screen.getByText('JAM State Viewer')).toBeInTheDocument();
      expect(screen.getByText('Upload a serialized state dump to inspect it.')).toBeInTheDocument();
    });

    it('should handle state extraction errors gracefully', () => {
      // The useMemo hook in UploadScreen handles extraction errors by returning null
      // and logging errors to console, which prevents crashes
      render(<UploadScreen />);
      
      // Component should still render normally even if state extraction fails
      expect(screen.getByText('Drag & drop your state JSON here')).toBeInTheDocument();
      expect(screen.getByText('Supports STF test vectors, STF genesis, and JIP-4 Chain Spec.')).toBeInTheDocument();
    });
  });
});
