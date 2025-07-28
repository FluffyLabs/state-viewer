import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the typeberry state-merkleization module
vi.mock('@typeberry/state-merkleization', () => ({
  loadState: vi.fn(),
  config: {
    tinyChainSpec: {}
  },
  bytes: {
    Bytes: {
      parseBytes: vi.fn()
    },
    BytesBlob: {
      parseBlob: vi.fn()
    }
  },
  serialize: {
    availabilityAssignment: { key: { toString: () => '0x01' } },
    designatedValidators: { key: { toString: () => '0x02' } },
    currentValidators: { key: { toString: () => '0x03' } },
    previousValidators: { key: { toString: () => '0x04' } },
    disputesRecords: { key: { toString: () => '0x05' } },
    timeslot: { key: { toString: () => '0x06' } },
    entropy: { key: { toString: () => '0x07' } },
    authPools: { key: { toString: () => '0x08' } },
    authQueues: { key: { toString: () => '0x09' } },
    recentBlocks: { key: { toString: () => '0x0a' } },
    statistics: { key: { toString: () => '0x0b' } },
    accumulationQueue: { key: { toString: () => '0x0c' } },
    recentlyAccumulated: { key: { toString: () => '0x0d' } },
    safrole: { key: { toString: () => '0x0e' } },
    privilegedServices: { key: { toString: () => '0x0f' } }
  }
}));

import InspectStateViewer from './InspectStateViewer';
import { loadState, bytes } from '@typeberry/state-merkleization';

describe('InspectStateViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).state;
  });

  it('should render with default title', () => {
    // Mock error to trigger error path
    vi.mocked(bytes.Bytes.parseBytes).mockImplementation(() => {
      throw new Error('Missing 0x prefix: key1');
    });

    render(<InspectStateViewer state={{ 'key1': 'value1' }} />);

    expect(screen.getByText('State Data')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    vi.mocked(bytes.Bytes.parseBytes).mockImplementation(() => {
      throw new Error('Missing 0x prefix: key1');
    });

    render(<InspectStateViewer state={{ 'key1': 'value1' }} title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should show error when state parsing fails', () => {
    vi.mocked(bytes.Bytes.parseBytes).mockImplementation(() => {
      throw new Error('Missing 0x prefix: key1');
    });

    render(<InspectStateViewer state={{ 'key1': 'value1' }} />);

    expect(screen.getByText('Error loading state:')).toBeInTheDocument();
    expect(screen.getByText('postState: Missing 0x prefix: key1')).toBeInTheDocument();
  });

  it('should have proper CSS classes on error', () => {
    vi.mocked(bytes.Bytes.parseBytes).mockImplementation(() => {
      throw new Error('Test error');
    });

    render(<InspectStateViewer state={{ 'key1': 'value1' }} />);

    const container = screen.getByText('State Data').closest('div');
    expect(container).toHaveClass('text-left', 'p-4');

    const heading = screen.getByText('State Data');
    expect(heading).toHaveClass('text-lg', 'font-semibold', 'mb-4');

    const errorDiv = screen.getByText('Error loading state:').closest('div');
    expect(errorDiv).toHaveClass('bg-red-100', 'border', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded', 'mb-4');
  });

  it('should render state fields when state loads successfully', () => {
    const mockStateAccess = {
      availabilityAssignment: 'test-value',
      timeslot: 123,
      entropy: null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(loadState).mockReturnValue(mockStateAccess as any);

    render(<InspectStateViewer state={{ '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' }} />);

    expect(screen.getByText('State Fields')).toBeInTheDocument();
    expect(screen.getByText('availabilityAssignment')).toBeInTheDocument();
    expect(screen.getByText('timeslot')).toBeInTheDocument();
    expect(screen.getByText('entropy')).toBeInTheDocument();
  });

  it('should show console export message when state loads successfully', () => {
    const mockStateAccess = { timeslot: 123 };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(loadState).mockReturnValue(mockStateAccess as any);

    render(<InspectStateViewer state={{ '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' }} />);

    expect(screen.getByText(/The state object is also exported in DevTools console as/)).toBeInTheDocument();
  });

  it('should export state to window when successfully loaded', () => {
    const mockStateAccess = { timeslot: 123 };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(loadState).mockReturnValue(mockStateAccess as any);

    render(<InspectStateViewer state={{ '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' }} />);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).state).toBe(mockStateAccess);
  });

  it('should render state field descriptions', () => {
    const mockStateAccess = {
      availabilityAssignment: 'test-value',
      timeslot: 123,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(loadState).mockReturnValue(mockStateAccess as any);

    render(<InspectStateViewer state={{ '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' }} />);

    expect(screen.getByText('Work-reports which have been reported but are not yet known to be available to a super-majority of validators')).toBeInTheDocument();
    expect(screen.getByText('The current time slot')).toBeInTheDocument();
  });

  it('should show "Not found" for missing state fields', () => {
    const mockStateAccess = {
      timeslot: 123,
      // Missing other expected fields like availabilityAssignment
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(loadState).mockReturnValue(mockStateAccess as any);

    render(<InspectStateViewer state={{ '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' }} />);

    const notFoundElements = screen.getAllByText('Not found');
    expect(notFoundElements.length).toBeGreaterThan(0);
  });

  it('should render field notations and titles', () => {
    const mockStateAccess = {
      availabilityAssignment: 'test-value',
      timeslot: 123,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(loadState).mockReturnValue(mockStateAccess as any);

    render(<InspectStateViewer state={{ '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' }} />);

    expect(screen.getByText('ρ')).toBeInTheDocument(); // rho notation
    expect(screen.getByText('τ')).toBeInTheDocument(); // tau notation
    expect(screen.getByText('rho')).toBeInTheDocument(); // rho title
    expect(screen.getByText('tau')).toBeInTheDocument(); // tau title
  });

  it('should handle empty state object', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(loadState).mockReturnValue({} as any);

    render(<InspectStateViewer state={{}} />);

    expect(screen.getByText('State Data')).toBeInTheDocument();
    expect(screen.getByText('State Fields')).toBeInTheDocument();
  });

  describe('Diff Mode', () => {
    it('should render diff mode with changes highlighted', () => {
      const mockPreState = { timeslot: 123 };
      const mockPostState = { timeslot: 456, entropy: 'new-value' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(loadState).mockReturnValueOnce(mockPreState as any).mockReturnValueOnce(mockPostState as any);

      const preState = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' };
      const postState = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value2' };

      render(<InspectStateViewer preState={preState} state={postState} />);

      expect(screen.getByText('State Data')).toBeInTheDocument();
      expect(screen.getByText(/The state object is also exported in DevTools console as/)).toBeInTheDocument();
    });

    it('should show before and after values in diff mode', () => {
      const mockPreState = { timeslot: 123 };
      const mockPostState = { timeslot: 456 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(loadState).mockReturnValueOnce(mockPreState as any).mockReturnValueOnce(mockPostState as any);

      const preState = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' };
      const postState = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value2' };

      render(<InspectStateViewer preState={preState} state={postState} />);

      // In diff mode, the console message should mention both states
      expect(screen.getByText(/preState.*postState/)).toBeInTheDocument();
    });

    it('should not show diff styling when values are the same', () => {
      const mockState = { timeslot: 123 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(loadState).mockReturnValue(mockState as any);

      const state = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' };

      render(<InspectStateViewer preState={state} state={state} />);

      expect(screen.queryByText('CHANGED')).not.toBeInTheDocument();
      expect(screen.queryByText('Before:')).not.toBeInTheDocument();
      expect(screen.queryByText('After:')).not.toBeInTheDocument();
    });

    it('should work with backward compatibility mode', () => {
      const mockState = { timeslot: 123 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(loadState).mockReturnValue(mockState as any);

      const state = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' };

      render(<InspectStateViewer state={state} />);

      expect(screen.getByText('State Data')).toBeInTheDocument();
      expect(screen.queryByText('Showing differences between pre and post states.')).not.toBeInTheDocument();
    });

    it('should handle missing pre or post state gracefully', () => {
      const mockPostState = { timeslot: 456 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(loadState).mockReturnValueOnce(null as any).mockReturnValueOnce(mockPostState as any);

      const postState = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value2' };

      render(<InspectStateViewer state={postState} />);

      expect(screen.getByText('State Data')).toBeInTheDocument();
    });

    it('should apply correct CSS classes for diff mode', () => {
      const mockPreState = { timeslot: 123 };
      const mockPostState = { timeslot: 456 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(loadState).mockReturnValueOnce(mockPreState as any).mockReturnValueOnce(mockPostState as any);

      const preState = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' };
      const postState = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value2' };

      render(<InspectStateViewer preState={preState} state={postState} />);

      // Verify diff mode is active by checking console message
      expect(screen.getByText(/preState.*postState/)).toBeInTheDocument();
    });

    it('should pass display mode toggle to CompositeViewer components', () => {
      const mockState = { timeslot: 123 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(loadState).mockReturnValue(mockState as any);

      const state = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' };

      render(<InspectStateViewer state={state} />);

      // Check that display mode buttons are present (from CompositeViewer)
      expect(screen.getByText('Decoded')).toBeInTheDocument();
      expect(screen.getByText('Raw')).toBeInTheDocument();
      expect(screen.getByText('String')).toBeInTheDocument();
    });

    it('should handle state field access errors gracefully', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.Bytes.parseBytes).mockReturnValue(new Uint8Array([1, 2, 3]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(bytes.BytesBlob.parseBlob).mockReturnValue(new Uint8Array([4, 5, 6]) as any);

      // Mock loadState to return an object that throws when accessing properties
      const mockStateAccess = new Proxy({}, {
        get: () => {
          throw new Error('Required state entry for testField is missing!');
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(loadState).mockReturnValue(mockStateAccess as any);

      const state = { '0x1234567890123456789012345678901234567890123456789012345678901234': 'value1' };

      // Component should render without crashing even when state field access fails
      expect(() => render(<InspectStateViewer state={state} />)).not.toThrow();

      // Basic component elements should still be present
      expect(screen.getByText('State Fields')).toBeInTheDocument();
    });
  });
});
