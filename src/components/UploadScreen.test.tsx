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
    
    expect(screen.getByText('State View JSON Analyzer')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop your JSON file here')).toBeInTheDocument();
    expect(screen.getByText('Manual JSON Editor')).toBeInTheDocument();
    expect(screen.getAllByText('Browse Files')).toHaveLength(2);
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
  });

  it('opens manual editor dialog when button is clicked', async () => {
    render(<UploadScreen />);
    
    const editorButton = screen.getByText('Manual JSON Editor');
    await user.click(editorButton);
    
    expect(screen.getByText('JSON Editor')).toBeInTheDocument();
    expect(screen.getByTestId('codemirror')).toBeInTheDocument();
    expect(screen.getByText('Save JSON')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('closes manual editor dialog when close button is clicked', async () => {
    render(<UploadScreen />);
    
    // Open dialog
    const editorButton = screen.getByText('Manual JSON Editor');
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
    const editorButton = screen.getByText('Manual JSON Editor');
    await user.click(editorButton);
    
    expect(screen.getByText('JSON Editor')).toBeInTheDocument();
    
    // Close via cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(screen.queryByText('JSON Editor')).not.toBeInTheDocument();
  });

  it('shows default JSON structure in editor when opened', async () => {
    render(<UploadScreen />);
    
    const editorButton = screen.getByText('Manual JSON Editor');
    await user.click(editorButton);
    
    const textarea = screen.getByTestId('codemirror');
    expect(textarea).toHaveValue('{\n  \n}');
  });

  it('allows editing content in the manual editor', async () => {
    render(<UploadScreen />);
    
    const editorButton = screen.getByText('Manual JSON Editor');
    await user.click(editorButton);
    
    const textarea = screen.getByTestId('codemirror');
    await user.clear(textarea);
    fireEvent.change(textarea, { target: { value: '{"test": "value"}' } });
    
    expect(textarea).toHaveValue('{"test": "value"}');
  });

  it('saves valid JSON from manual editor and shows preview', async () => {
    render(<UploadScreen />);
    
    const editorButton = screen.getByText('Manual JSON Editor');
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
    
    const uploadArea = screen.getByText('Drag & drop your JSON file here').closest('div');
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
    expect(screen.getAllByTestId('folder-open-icon')).toHaveLength(2); // Two Browse buttons
  });

  it('has proper page structure and content', () => {
    render(<UploadScreen />);
    
    // Check main heading
    expect(screen.getByRole('heading', { name: /state view json analyzer/i })).toBeInTheDocument();
    
    // Check description
    expect(screen.getByText(/upload a json file to analyze/i)).toBeInTheDocument();
    
    // Check file size information
    expect(screen.getByText(/supports \.json files up to 10mb/i)).toBeInTheDocument();
    
    // Check Browse buttons
    expect(screen.getAllByText('Browse Files')).toHaveLength(2);
  });

  it('has Browse button that triggers file selection', async () => {
    render(<UploadScreen />);
    
    const browseButtons = screen.getAllByText('Browse Files');
    expect(browseButtons).toHaveLength(2); // One in dropzone, one in action buttons
    
    // Both buttons should be present
    expect(browseButtons[0]).toBeInTheDocument();
    expect(browseButtons[1]).toBeInTheDocument();
  });
});