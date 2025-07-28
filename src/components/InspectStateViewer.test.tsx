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
    expect(screen.getByText('Missing 0x prefix: key1')).toBeInTheDocument();
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
    
    expect(screen.getByText('The state object is also exported in DevTools console as `state`.')).toBeInTheDocument();
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
});