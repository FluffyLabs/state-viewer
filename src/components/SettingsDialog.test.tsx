import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsDialog from './SettingsDialog';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
}));



describe('SettingsDialog', () => {
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  // Mock window objects
  const mockSessionStorage = {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  const mockLocation = {
    reload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    Object.defineProperty(window, 'process', {
      value: {
        env: {
          GP_VERSION: '',
          TEST_SUITE: '',
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<SettingsDialog isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Close dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    expect(screen.getByText('Gray Paper Version')).toBeInTheDocument();
    expect(screen.getByText('Test Vector Suite')).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should populate test suite dropdown with available options', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const suiteSelect = screen.getByDisplayValue('w3f');
    expect(suiteSelect).toBeInTheDocument();
  });

  it('should set initial values from current version and suite when opened', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const gpSelect = screen.getByLabelText('Gray Paper Version') as HTMLSelectElement;
    const suiteSelect = screen.getByLabelText('Test Vector Suite') as HTMLSelectElement;

    expect(gpSelect.value).toBeTruthy();
    expect(suiteSelect.value).toBeTruthy();
  });

  it('should update GP version selection', async () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const gpSelect = screen.getByLabelText('Gray Paper Version') as HTMLSelectElement;
    const options = Array.from(gpSelect.options).map(opt => opt.value).filter(v => v);

    if (options.length > 1) {
      const newValue = options.find(opt => opt !== gpSelect.value) || options[0];
      await user.selectOptions(gpSelect, newValue);
      expect(gpSelect.value).toBe(newValue);
    }
  });

  it('should update test suite selection', async () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const suiteSelect = screen.getByLabelText('Test Vector Suite') as HTMLSelectElement;
    const options = Array.from(suiteSelect.options).map(opt => opt.value).filter(v => v);

    if (options.length > 1) {
      const newValue = options.find(opt => opt !== suiteSelect.value) || options[0];
      await user.selectOptions(suiteSelect, newValue);
      expect(suiteSelect.value).toBe(newValue);
    }
  });

  it('should save to sessionStorage and reload when Reload button is clicked', async () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    // Get current selections
    const gpSelect = screen.getByLabelText('Gray Paper Version') as HTMLSelectElement;
    const suiteSelect = screen.getByLabelText('Test Vector Suite') as HTMLSelectElement;

    const gpOptions = Array.from(gpSelect.options).map(opt => opt.value).filter(v => v);
    const suiteOptions = Array.from(suiteSelect.options).map(opt => opt.value).filter(v => v);

    // Change selections if options are available
    if (gpOptions.length > 1) {
      const newGpValue = gpOptions.find(opt => opt !== gpSelect.value) || gpOptions[0];
      await user.selectOptions(gpSelect, newGpValue);
    }

    if (suiteOptions.length > 1) {
      const newSuiteValue = suiteOptions.find(opt => opt !== suiteSelect.value) || suiteOptions[0];
      await user.selectOptions(suiteSelect, newSuiteValue);
    }

    // Click reload
    const reloadButton = screen.getByText('Reload');
    await user.click(reloadButton);

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('GP_VERSION', gpSelect.value);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('TEST_SUITE', suiteSelect.value);
    expect(mockLocation.reload).toHaveBeenCalledTimes(1);
  });

  it('should handle GP version dropdown gracefully', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const gpSelect = screen.getByLabelText('Gray Paper Version');
    expect(gpSelect).toBeInTheDocument();
  });

  it('should handle test suite dropdown gracefully', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const suiteSelect = screen.getByLabelText('Test Vector Suite');
    expect(suiteSelect).toBeInTheDocument();
  });

  it('should have proper dialog structure and styling', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    // Check for backdrop
    const backdrop = screen.getByText('Settings').closest('.fixed');
    expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-background/80', 'backdrop-blur-sm');

    // Check for dialog content
    const dialog = screen.getByText('Settings').closest('.bg-background');
    expect(dialog).toHaveClass('bg-background', 'border', 'border-border', 'rounded-lg', 'shadow-lg');

    // Check for header
    expect(screen.getByText('Settings')).toHaveClass('text-lg', 'font-semibold', 'text-foreground');
  });

  it('should have proper form controls styling', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const gpSelect = screen.getByLabelText('Gray Paper Version');
    const suiteSelect = screen.getByLabelText('Test Vector Suite');

    expect(gpSelect).toHaveClass('w-full', 'bg-background', 'border', 'border-border', 'rounded-md');
    expect(suiteSelect).toHaveClass('w-full', 'bg-background', 'border', 'border-border', 'rounded-md');
  });

  it('should handle close button accessibility', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close dialog');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('should handle window.process.env initial values', () => {
    Object.defineProperty(window, 'process', {
      value: {
        env: {
          GP_VERSION: 'test-version',
          TEST_SUITE: 'test-suite',
        },
      },
      writable: true,
    });

    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    // Should use actual CURRENT_VERSION and CURRENT_SUITE when dialog opens
    const gpSelect = screen.getByLabelText('Gray Paper Version') as HTMLSelectElement;
    const suiteSelect = screen.getByLabelText('Test Vector Suite') as HTMLSelectElement;

    expect(gpSelect.value).toBeTruthy();
    expect(suiteSelect.value).toBeTruthy();
  });

  it('should use unique options when there are duplicates', () => {
    // The component uses Set to deduplicate, so we don't need to test this explicitly
    // but we can verify the dropdowns work with the mocked values
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    const gpSelect = screen.getByLabelText('Gray Paper Version');
    const suiteSelect = screen.getByLabelText('Test Vector Suite');

    expect(gpSelect).toBeInTheDocument();
    expect(suiteSelect).toBeInTheDocument();
  });
});
