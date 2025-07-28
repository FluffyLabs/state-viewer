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

describe('StateViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
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
    expect(screen.getByText('0xdeadbeef')).toBeInTheDocument();
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
    const longValue = '0x1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(screen.getByText('0x12345678...abcdef')).toBeInTheDocument();
    
    // Should show length information
    expect(screen.getByText(`Length: ${longValue.length} characters`)).toBeInTheDocument();
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

  it('should copy value to clipboard', async () => {
    render(<StateViewer state={mockState} />);
    
    const copyButtons = screen.getAllByLabelText('Copy value');
    const firstValueCopyButton = copyButtons[0]; // First value copy button
    
    fireEvent.click(firstValueCopyButton);
    
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

  describe('Pagination', () => {
    const largeState: Record<string, string> = {};
    for (let i = 0; i < 25; i++) {
      largeState[`0x${i.toString(16).padStart(2, '0')}`] = `0x${(i * 123).toString(16)}`;
    }

    it('should show pagination when there are more than 10 items', () => {
      render(<StateViewer state={largeState} />);
      
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText(/Showing 1 to 10 of 25 entries/)).toBeInTheDocument();
    });

    it('should navigate to next page', () => {
      render(<StateViewer state={largeState} />);
      
      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(screen.getByText(/Showing 11 to 20 of 25 entries/)).toBeInTheDocument();
    });

    it('should navigate to previous page', () => {
      render(<StateViewer state={largeState} />);
      
      // Go to page 2 first
      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);
      
      // Then go back to page 1
      const prevButton = screen.getByLabelText('Previous page');
      fireEvent.click(prevButton);
      
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      render(<StateViewer state={largeState} />);
      
      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(<StateViewer state={largeState} />);
      
      // Navigate to last page
      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton); // Page 2
      fireEvent.click(nextButton); // Page 3
      
      expect(nextButton).toBeDisabled();
    });

    it('should reset to page 1 when searching', () => {
      render(<StateViewer state={largeState} />);
      
      // Go to page 2
      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      
      // Search - should reset to page 1
      const searchInput = screen.getByPlaceholderText('Search keys or values...');
      fireEvent.change(searchInput, { target: { value: '0x0' } }); // This will match multiple entries
      
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });
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
    
    expect(screen.getByText('0xEFGH')).toBeInTheDocument();
    expect(screen.queryByText('0xabcd')).not.toBeInTheDocument();
  });
});