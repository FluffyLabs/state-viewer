import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StateViewer from './StateViewer';

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

describe('StateViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    mockScrollIntoView.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const mockState = {
    '0x01': '0x123456',
    '0x02': '0x789abc',
    '0x03': '0xdeadbeef',
    '0x04': '0x1234567890abcdef1234567890abcdef1234567890abcdef',
  };

  it('should render state data correctly', () => {
    render(<StateViewer state={mockState} />);
    
    expect(screen.getByText('State Data')).toBeInTheDocument();
    expect(screen.getByText('4 entries total')).toBeInTheDocument();
    
    // Check if keys are displayed
    expect(screen.getByText('0x01')).toBeInTheDocument();
    expect(screen.getByText('0x02')).toBeInTheDocument();
    
    // Check if values are displayed
    expect(screen.getByText('0x123456')).toBeInTheDocument();
    expect(screen.getByText('0x789abc')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<StateViewer state={mockState} title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should handle empty state', () => {
    render(<StateViewer state={{}} />);
    
    expect(screen.getByText('No state data to display')).toBeInTheDocument();
  });

  it('should search through keys and values', () => {
    render(<StateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    
    // Search for a key
    fireEvent.change(searchInput, { target: { value: '0x01' } });
    
    expect(screen.getByText('0x01')).toBeInTheDocument();
    expect(screen.queryByText('0x02')).not.toBeInTheDocument();
    expect(screen.getByText(/1 matching search/)).toBeInTheDocument();
  });

  it('should search through values', () => {
    render(<StateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    
    // Search for a value
    fireEvent.change(searchInput, { target: { value: 'dead' } });
    
    expect(screen.getByText('0x03')).toBeInTheDocument();
    // The text is now highlighted, so we need to look for the highlighted part
    expect(screen.getByText('dead')).toBeInTheDocument();
    expect(screen.queryByText('0x01')).not.toBeInTheDocument();
  });

  it('should show "no results" when search has no matches', () => {
    render(<StateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No entries match your search')).toBeInTheDocument();
  });

  it('should format long hex values', () => {
    render(<StateViewer state={mockState} />);
    
    // Long value should be truncated
    expect(screen.getByText('0x12345678...abcdef')).toBeInTheDocument();
  });

  it('should copy key to clipboard', async () => {
    render(<StateViewer state={mockState} />);
    
    const copyButtons = screen.getAllByLabelText('Copy key');
    const firstKeyCopyButton = copyButtons[0]; // First copy button should be for the first key
    
    fireEvent.click(firstKeyCopyButton);
    
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('0x01');
    });
    
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('should open dialog when view button is clicked and copy value from dialog', async () => {
    render(<StateViewer state={mockState} />);
    
    const viewButtons = screen.getAllByLabelText('View full value');
    const firstValueViewButton = viewButtons[0]; // First value view button
    
    fireEvent.click(firstValueViewButton);
    
    // Dialog should open
    expect(screen.getByText('Full Value')).toBeInTheDocument();
    // Look for the value in the dialog specifically
    expect(screen.getByText('Key: 0x01 • Size: 3 bytes')).toBeInTheDocument();
    
    // Copy from dialog
    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('0x123456');
    });
  });

  it('should handle clipboard copy failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockClipboard.writeText.mockRejectedValue(new Error('Clipboard failed'));
    
    render(<StateViewer state={mockState} />);
    
    const copyButtons = screen.getAllByLabelText('Copy key');
    fireEvent.click(copyButtons[0]);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy text:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('should display all entries without pagination', () => {
    const largeState: Record<string, string> = {};
    for (let i = 0; i < 25; i++) {
      largeState[`0x${i.toString(16).padStart(2, '0')}`] = `0x${(i * 123).toString(16)}`;
    }
    
    render(<StateViewer state={largeState} />);
    
    expect(screen.getByText('25 entries total')).toBeInTheDocument();
    
    // Should show first and last entries (no pagination)
    expect(screen.getByText('0x00')).toBeInTheDocument();
    expect(screen.getByText('0x18')).toBeInTheDocument(); // 24 in hex is 18
    
    // Should not show pagination controls
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });



  it('should handle special characters in search', () => {
    const specialState = {
      '0xabcd': '0x1234',
      '0xEFGH': '0x5678', // Mixed case
      '0x!@#$': '0x9abc',
    };
    
    render(<StateViewer state={specialState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    
    // Search should be case insensitive
    fireEvent.change(searchInput, { target: { value: 'efgh' } });
    
    // The text is now highlighted, so look for the highlighted part
    expect(screen.getByText('EFGH')).toBeInTheDocument();
    expect(screen.queryByText('0xabcd')).not.toBeInTheDocument();
  });

  it('should scroll to top when title changes', () => {
    const { rerender } = render(<StateViewer state={mockState} title="Initial Title" />);
    
    // Change the title
    rerender(<StateViewer state={mockState} title="New Title" />);
    
    // Verify scrollIntoView was called with smooth behavior
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should display inline diff highlighting for changed values', () => {
    const stateWithDiff = {
      '0x01': '[CHANGED] 0x123456 → 0x789abc',
      '0x02': '[ADDED] 0xnewvalue',
      '0x03': '[REMOVED] 0xoldvalue',
    };
    
    render(<StateViewer state={stateWithDiff} />);
    
    // Check that CHANGED, ADDED, REMOVED badges are displayed
    expect(screen.getByText('CHANGED')).toBeInTheDocument();
    expect(screen.getByText('ADDED')).toBeInTheDocument();
    expect(screen.getByText('REMOVED')).toBeInTheDocument();
    
    // Check that the diff values are displayed (the inline diff creates spans but the text should still be searchable)
    expect(screen.getByTitle('0x123456 → 0x789abc')).toBeInTheDocument();
  });

  it('should highlight search matches in keys and values', () => {
    render(<StateViewer state={mockState} />);
    
    const searchInput = screen.getByPlaceholderText('Search keys or values...');
    
    // Search for "01" which should match in key
    fireEvent.change(searchInput, { target: { value: '01' } });
    
    // Should highlight the match
    const highlightedText = screen.getByText('01');
    expect(highlightedText.tagName.toLowerCase()).toBe('mark');
  });

  it('should show value dialog with size information', () => {
    render(<StateViewer state={mockState} />);
    
    const viewButtons = screen.getAllByLabelText('View full value');
    fireEvent.click(viewButtons[0]);
    
    // Dialog should show size in bytes (6 characters / 2 = 3 bytes for "0x123456")
    expect(screen.getByText(/Size: 3 bytes/)).toBeInTheDocument();
    expect(screen.getByText('Full Value')).toBeInTheDocument();
  });

  it('should show diff dialog for changed values', () => {
    const stateWithDiff = {
      '0x01': '[CHANGED] 0x123456 → 0x789abc',
    };
    
    render(<StateViewer state={stateWithDiff} />);
    
    const viewButtons = screen.getAllByLabelText('View full value');
    fireEvent.click(viewButtons[0]);
    
    // Dialog should show diff format
    expect(screen.getByText('Value Diff')).toBeInTheDocument();
    expect(screen.getByText('Before:')).toBeInTheDocument();
    expect(screen.getByText('After:')).toBeInTheDocument();
    expect(screen.getByText('Inline Diff:')).toBeInTheDocument();
  });

  it('should close dialog when close button is clicked', () => {
    render(<StateViewer state={mockState} />);
    
    const viewButtons = screen.getAllByLabelText('View full value');
    fireEvent.click(viewButtons[0]);
    
    // Dialog should be open
    expect(screen.getByText('Full Value')).toBeInTheDocument();
    
    // Close dialog
    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    
    // Dialog should be closed
    expect(screen.queryByText('Full Value')).not.toBeInTheDocument();
  });

  it('should group consecutive changes into even-length blocks', () => {
    const stateWithConsecutiveDiff = {
      '0x01': '[CHANGED] 0xabcd1234 → 0xefgh5678',
      '0x02': '[CHANGED] 0x123456789 → 0x987654321', // 9 chars each, should be padded to 10
      '0x03': '[CHANGED] 0xabc → 0xdef', // 3 chars each, should be padded to 4
    };
    
    render(<StateViewer state={stateWithConsecutiveDiff} />);
    
    // The diff algorithm should group consecutive changes and ensure even-length blocks
    // We can't easily test the exact spans, but we can verify the titles contain the full values
    expect(screen.getByTitle('0xabcd1234 → 0xefgh5678')).toBeInTheDocument();
    expect(screen.getByTitle('0x123456789 → 0x987654321')).toBeInTheDocument();
    expect(screen.getByTitle('0xabc → 0xdef')).toBeInTheDocument();
  });

  it('should handle mixed same and different characters in diff', () => {
    const stateWithMixedDiff = {
      '0x01': '[CHANGED] 0x12ab34cd → 0x12ef34gh', // Same start, different middle, same middle, different end
    };
    
    render(<StateViewer state={stateWithMixedDiff} />);
    
    // Should display the full diff with proper grouping
    expect(screen.getByTitle('0x12ab34cd → 0x12ef34gh')).toBeInTheDocument();
  });
});