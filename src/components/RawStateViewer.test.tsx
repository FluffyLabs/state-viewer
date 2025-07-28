import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import RawStateViewer from './RawStateViewer';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('RawStateViewer', () => {
  const user = userEvent.setup();
  const mockState = {
    'key1': 'value1',
    'key2': 'value2',
    'longKey': '0x1234567890abcdef1234567890abcdef1234567890abcdef',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with state data', () => {
    render(<RawStateViewer state={mockState} />);
    
    expect(screen.getByText('key1')).toBeInTheDocument();
    expect(screen.getByText('value1')).toBeInTheDocument();
    expect(screen.getByText('key2')).toBeInTheDocument();
    expect(screen.getByText('value2')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<RawStateViewer state={mockState} title="Custom Title" />);
    
    expect(screen.getByText('key1')).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<RawStateViewer state={{}} />);
    
    expect(screen.getByText('No state data to display')).toBeInTheDocument();
  });

  it('should filter entries based on search term', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    await user.type(searchInput, 'key1');
    
    expect(screen.getByText('key1')).toBeInTheDocument();
    expect(screen.queryByText('key2')).not.toBeInTheDocument();
  });

  it('should search by value content', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    await user.type(searchInput, 'value1');
    
    expect(screen.getByText('key1')).toBeInTheDocument();
    expect(screen.queryByText('key2')).not.toBeInTheDocument();
  });

  it('should show no results message when search has no matches', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    await user.type(searchInput, 'nonexistent');
    
    expect(screen.getByText('No entries match your search')).toBeInTheDocument();
  });

  it('should display entry count correctly', () => {
    render(<RawStateViewer state={mockState} />);
    
    expect(screen.getByText('3 entries total')).toBeInTheDocument();
  });

  it('should display filtered count when searching', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    await user.type(searchInput, 'key1');
    
    expect(screen.getByText('3 entries total • 1 matching search')).toBeInTheDocument();
  });

  it('should copy key to clipboard', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    render(<RawStateViewer state={mockState} />);
    
    const copyButtons = screen.getAllByLabelText('Copy key');
    await user.click(copyButtons[0]);
    
    expect(writeTextSpy).toHaveBeenCalledWith('key1');
  });

  it('should show copied feedback', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const copyButtons = screen.getAllByLabelText('Copy key');
    await user.click(copyButtons[0]);
    
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('should open dialog when view button is clicked', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const viewButtons = screen.getAllByLabelText('View full value');
    await user.click(viewButtons[0]);
    
    expect(screen.getByText('Full Value')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should close dialog when close button is clicked', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const viewButtons = screen.getAllByLabelText('View full value');
    await user.click(viewButtons[0]);
    
    expect(screen.getByText('Full Value')).toBeInTheDocument();
    
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);
    
    expect(screen.queryByText('Full Value')).not.toBeInTheDocument();
  });

  it('should handle added diff entries', () => {
    const stateWithAdded = {
      'addedKey': '[ADDED] newValue'
    };
    render(<RawStateViewer state={stateWithAdded} />);
    
    expect(screen.getByText('ADDED')).toBeInTheDocument();
    expect(screen.getByText('newValue')).toBeInTheDocument();
  });

  it('should handle removed diff entries', () => {
    const stateWithRemoved = {
      'removedKey': '[REMOVED] oldValue'
    };
    render(<RawStateViewer state={stateWithRemoved} />);
    
    expect(screen.getByText('REMOVED')).toBeInTheDocument();
    expect(screen.getByText('oldValue')).toBeInTheDocument();
  });

  it('should handle changed diff entries', () => {
    const stateWithChanged = {
      'changedKey': '[CHANGED] oldValue → newValue'
    };
    render(<RawStateViewer state={stateWithChanged} />);
    
    expect(screen.getByText('CHANGED')).toBeInTheDocument();
  });

  it('should show diff dialog for changed entries', async () => {
    const stateWithChanged = {
      'changedKey': '[CHANGED] oldValue → newValue'
    };
    render(<RawStateViewer state={stateWithChanged} />);
    
    const viewButton = screen.getByLabelText('View full value');
    await user.click(viewButton);
    
    expect(screen.getByText('Value Diff')).toBeInTheDocument();
    expect(screen.getByText('Before:')).toBeInTheDocument();
    expect(screen.getByText('After:')).toBeInTheDocument();
  });

  it('should format long hex values', () => {
    render(<RawStateViewer state={mockState} />);
    
    expect(screen.getByText('0x12345678...abcdef')).toBeInTheDocument();
  });

  it('should highlight search matches', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    await user.type(searchInput, 'key1');
    
    const highlightedText = screen.getByText('key1');
    expect(highlightedText.closest('mark')).toBeInTheDocument();
  });

  it('should copy dialog content', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    render(<RawStateViewer state={mockState} />);
    
    const viewButtons = screen.getAllByLabelText('View full value');
    await user.click(viewButtons[0]);
    
    // Wait for dialog to open and find the copy button within it
    await waitFor(() => {
      expect(screen.getByText('Full Value')).toBeInTheDocument();
    });
    
    const copyButton = screen.getByRole('button', { name: 'Copy' });
    await user.click(copyButton);
    
    expect(writeTextSpy).toHaveBeenCalledWith('value1');
  });

  it('should handle copy errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Copy failed'));
    
    render(<RawStateViewer state={mockState} />);
    
    const copyButtons = screen.getAllByLabelText('Copy key');
    await user.click(copyButtons[0]);
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to copy text:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('should close dialog with X button', async () => {
    render(<RawStateViewer state={mockState} />);
    
    const viewButtons = screen.getAllByLabelText('View full value');
    await user.click(viewButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Full Value')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);
    
    expect(screen.queryByText('Full Value')).not.toBeInTheDocument();
  });
});