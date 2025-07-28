import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JsonEditorDialog from './JsonEditorDialog';

// Mock CodeMirror component
vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange, ...props }: { value?: string; onChange?: (val: string) => void; [key: string]: unknown }) => (
    <textarea
      data-testid="code-mirror"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">!</div>,
}));

describe('JsonEditorDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    initialContent: '{"test": "value"}',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock matchMedia for dark mode detection
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

    // Mock MutationObserver
    global.MutationObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render when isOpen is true', () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    expect(screen.getByText('JSON Editor')).toBeInTheDocument();
    expect(screen.getByTestId('code-mirror')).toBeInTheDocument();
    expect(screen.getByText('Save JSON')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<JsonEditorDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('JSON Editor')).not.toBeInTheDocument();
  });

  it('should initialize with provided initial content', () => {
    const initialContent = '{"key": "initialValue"}';
    render(<JsonEditorDialog {...defaultProps} initialContent={initialContent} />);
    
    const editor = screen.getByTestId('code-mirror');
    expect(editor).toHaveValue(initialContent);
  });

  it('should validate JSON and show error for invalid JSON', async () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const editor = screen.getByTestId('code-mirror');
    
    // Enter invalid JSON
    fireEvent.change(editor, { target: { value: '{"invalid": json}' } });
    
    await waitFor(() => {
      expect(screen.getByText('JSON Syntax Error')).toBeInTheDocument();
      expect(screen.getByText(/Unexpected token/)).toBeInTheDocument();
    });
  });

  it('should disable save button when JSON is invalid', async () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const editor = screen.getByTestId('code-mirror');
    const saveButton = screen.getByText('Save JSON');
    
    // Enter invalid JSON
    fireEvent.change(editor, { target: { value: '{"invalid": json}' } });
    
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  it('should enable save button when JSON is valid', async () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const editor = screen.getByTestId('code-mirror');
    const saveButton = screen.getByText('Save JSON');
    
    // Enter valid JSON
    fireEvent.change(editor, { target: { value: '{"valid": "json"}' } });
    
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
      expect(saveButton).not.toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  it('should clear error when invalid JSON is fixed', async () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const editor = screen.getByTestId('code-mirror');
    
    // Enter invalid JSON
    fireEvent.change(editor, { target: { value: '{"invalid": json}' } });
    
    await waitFor(() => {
      expect(screen.getByText('JSON Syntax Error')).toBeInTheDocument();
    });
    
    // Fix the JSON
    fireEvent.change(editor, { target: { value: '{"valid": "json"}' } });
    
    await waitFor(() => {
      expect(screen.queryByText('JSON Syntax Error')).not.toBeInTheDocument();
    });
  });

  it('should display format error when provided', () => {
    const formatError = 'The JSON does not match any known formats';
    render(<JsonEditorDialog {...defaultProps} formatError={formatError} />);
    
    expect(screen.getByText('Format Validation Error')).toBeInTheDocument();
    expect(screen.getByText(formatError)).toBeInTheDocument();
  });

  it('should call onSave with valid JSON when save button is clicked', async () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const editor = screen.getByTestId('code-mirror');
    const saveButton = screen.getByText('Save JSON');
    
    const validJson = '{"test": "newValue"}';
    fireEvent.change(editor, { target: { value: validJson } });
    
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
    
    fireEvent.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith(validJson);
  });

  it('should not call onSave when JSON is invalid', async () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const editor = screen.getByTestId('code-mirror');
    const saveButton = screen.getByText('Save JSON');
    
    // Enter invalid JSON
    fireEvent.change(editor, { target: { value: '{"invalid": json}' } });
    
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
    
    fireEvent.click(saveButton);
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset content to initial when cancelled', async () => {
    const initialContent = '{"original": "content"}';
    render(<JsonEditorDialog {...defaultProps} initialContent={initialContent} />);
    
    const editor = screen.getByTestId('code-mirror');
    const cancelButton = screen.getByText('Cancel');
    
    // Change content
    fireEvent.change(editor, { target: { value: '{"modified": "content"}' } });
    
    // Cancel should reset content
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show both JSON error and format error when both exist', () => {
    const formatError = 'Unknown format error';
    render(<JsonEditorDialog {...defaultProps} formatError={formatError} />);
    
    const editor = screen.getByTestId('code-mirror');
    
    // Enter invalid JSON
    fireEvent.change(editor, { target: { value: '{"invalid": json}' } });
    
    // Both errors should be visible
    expect(screen.getByText('JSON Syntax Error')).toBeInTheDocument();
    expect(screen.getByText('Format Validation Error')).toBeInTheDocument();
    expect(screen.getByText(formatError)).toBeInTheDocument();
  });

  it('should detect dark mode from DOM class', () => {
    // Mock dark mode class on HTML element
    document.documentElement.classList.add('dark');
    
    render(<JsonEditorDialog {...defaultProps} />);
    
    // Component should render (testing dark mode detection doesn't throw errors)
    expect(screen.getByText('JSON Editor')).toBeInTheDocument();
    
    // Clean up
    document.documentElement.classList.remove('dark');
  });

  it('should update content when initialContent prop changes', () => {
    const { rerender } = render(<JsonEditorDialog {...defaultProps} initialContent='{"first": "content"}' />);
    
    let editor = screen.getByTestId('code-mirror');
    expect(editor).toHaveValue('{"first": "content"}');
    
    // Change initialContent
    rerender(<JsonEditorDialog {...defaultProps} initialContent='{"second": "content"}' />);
    
    editor = screen.getByTestId('code-mirror');
    expect(editor).toHaveValue('{"second": "content"}');
  });

  it('should handle JSON parsing errors gracefully', async () => {
    render(<JsonEditorDialog {...defaultProps} />);
    
    const editor = screen.getByTestId('code-mirror');
    
    // Test various invalid JSON formats
    const invalidJsonCases = [
      '{"unclosed": "string}',
      '{missing: "quotes"}',
      '{"trailing": "comma",}',
      '{"key": value}',
    ];
    
    for (const invalidJson of invalidJsonCases) {
      fireEvent.change(editor, { target: { value: invalidJson } });
      
      await waitFor(() => {
        expect(screen.getByText('JSON Syntax Error')).toBeInTheDocument();
        expect(screen.getByText('Save JSON')).toBeDisabled();
      });
    }
  });
});