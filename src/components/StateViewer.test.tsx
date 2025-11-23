import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StateViewer from './StateViewer';

// Mock the getChainSpecType function
vi.mock('@/utils', () => ({
  getChainSpecType: vi.fn(() => 'tiny'),
}));

// Mock the child components
vi.mock('./RawStateViewer', () => ({
  default: ({ title, searchTerm }: { title?: string; searchTerm?: string }) => (
    <div data-testid="raw-state-viewer">
      RawStateViewer - {title} - {searchTerm}
    </div>
  ),
}));

vi.mock('./InspectStateViewer', () => ({
  default: ({ chainSpec, searchTerm }: { chainSpec?: string; searchTerm?: string }) => (
    <div data-testid="inspect-state-viewer">
      InspectStateViewer - {chainSpec} - {searchTerm}
    </div>
  ),
}));

const mockState = {
  'key1': 'value1',
  'key2': 'value2',
};

const mockPreState = {
  'key1': 'oldvalue1',
  'key3': 'value3',
};

describe('StateViewer', () => {
  const mockChangeView = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { getChainSpecType } = await import('@/utils');
    vi.mocked(getChainSpecType).mockReturnValue('tiny');
  });

  it('should render state data correctly', () => {
    render(
      <StateViewer
        state={mockState}
        tab="decoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );

    // Check that the search input is present
    expect(screen.getByPlaceholderText('Search state fields, or raw keys and values...')).toBeInTheDocument();

    // Check that tabs are rendered
    expect(screen.getByText('Trie')).toBeInTheDocument();
    expect(screen.getByText('Encoded')).toBeInTheDocument();
    expect(screen.getByText('Decoded')).toBeInTheDocument();

    // Check that the correct viewer is shown
    expect(screen.getByTestId('inspect-state-viewer')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(
      <StateViewer 
        state={mockState}
        title="Custom Title"
        tab="encoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );
    
    expect(screen.getByText(/RawStateViewer - Custom Title/)).toBeInTheDocument();
  });

  it('should call changeView when tab is clicked', () => {
    render(
      <StateViewer
        state={mockState}
        tab="decoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );

    fireEvent.click(screen.getByText('Encoded'));
    expect(mockChangeView).toHaveBeenCalledWith('encoded', 'post_state');
  });

  it('should disable Trie tab when stateType is diff', () => {
    render(
      <StateViewer 
        state={mockState}
        preState={mockPreState}
        tab="encoded"
        stateType="diff"
        changeView={mockChangeView}
      />
    );
    
    const trieTab = screen.getByText('Trie');
    expect(trieTab.closest('button')).toBeDisabled();
  });

  it('should pass search term to child components', () => {
    render(
      <StateViewer 
        state={mockState}
        tab="encoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search state fields, or raw keys and values...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(screen.getByText(/RawStateViewer.*test search/)).toBeInTheDocument();
  });

  it('should render RawStateViewer for encoded tab', () => {
    render(
      <StateViewer 
        state={mockState}
        tab="encoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );
    
    expect(screen.getByTestId('raw-state-viewer')).toBeInTheDocument();
    expect(screen.queryByTestId('inspect-state-viewer')).not.toBeInTheDocument();
  });

  it('should render InspectStateViewer for decoded tab', () => {
    render(
      <StateViewer
        state={mockState}
        tab="decoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );

    expect(screen.getByTestId('inspect-state-viewer')).toBeInTheDocument();
    expect(screen.queryByTestId('raw-state-viewer')).not.toBeInTheDocument();
  });

  it('should render InspectStateViewer for decoded tab with full spec', async () => {
    const { getChainSpecType } = await import('@/utils');
    vi.mocked(getChainSpecType).mockReturnValue('full');

    render(
      <StateViewer
        state={mockState}
        tab="decoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );

    expect(screen.getByTestId('inspect-state-viewer')).toBeInTheDocument();
    expect(screen.queryByTestId('raw-state-viewer')).not.toBeInTheDocument();
    expect(screen.getByText(/InspectStateViewer - full/)).toBeInTheDocument();
  });

  it('should pass correct chainSpec to InspectStateViewer', () => {
    render(
      <StateViewer
        state={mockState}
        tab="decoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );

    expect(screen.getByText(/InspectStateViewer - tiny/)).toBeInTheDocument();
  });

  it('should pass preState to child components when provided', () => {
    render(
      <StateViewer 
        state={mockState}
        preState={mockPreState}
        tab="encoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );
    
    const rawStateViewer = screen.getByTestId('raw-state-viewer');
    expect(rawStateViewer).toBeInTheDocument();
  });

  it('should handle all valid tab changes correctly', () => {
    render(
      <StateViewer
        state={mockState}
        tab="encoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );

    // Test all valid tab changes
    fireEvent.click(screen.getByText('Trie'));
    expect(mockChangeView).toHaveBeenCalledWith('trie', 'post_state');

    vi.clearAllMocks();

    fireEvent.click(screen.getByText('Decoded'));
    expect(mockChangeView).toHaveBeenCalledWith('decoded', 'post_state');

    vi.clearAllMocks();

    fireEvent.click(screen.getByText('Encoded'));
    expect(mockChangeView).toHaveBeenCalledWith('encoded', 'post_state');
  });

  it('should update search term when input changes', () => {
    render(
      <StateViewer
        state={mockState}
        tab="decoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search state fields, or raw keys and values...');
    fireEvent.change(searchInput, { target: { value: 'new search' } });

    expect(screen.getByText(/InspectStateViewer.*new search/)).toBeInTheDocument();
  });

  it('should maintain tab state when search term changes', () => {
    render(
      <StateViewer
        state={mockState}
        tab="decoded"
        stateType="post_state"
        changeView={mockChangeView}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search state fields, or raw keys and values...');
    fireEvent.change(searchInput, { target: { value: 'search term' } });

    // Should still show the decoded tab content
    expect(screen.getByText(/InspectStateViewer - tiny/)).toBeInTheDocument();
  });

  it('should call changeView with correct parameters when switching tabs', () => {
    render(
      <StateViewer
        state={mockState}
        tab="encoded"
        stateType="pre_state"
        changeView={mockChangeView}
      />
    );

    fireEvent.click(screen.getByText('Decoded'));
    expect(mockChangeView).toHaveBeenCalledWith('decoded', 'pre_state');
  });
});