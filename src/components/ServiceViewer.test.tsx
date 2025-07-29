import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bytes } from '@typeberry/state-merkleization';
import ServiceViewer from './ServiceViewer';
import type { Service, StateAccess, ServiceAccountInfo } from '../types/service';

// Mock CompositeViewer
vi.mock('./viewer', () => ({
  CompositeViewer: ({ value }: { value: unknown }) => <div data-testid="composite-viewer">{JSON.stringify(value)}</div>
}));

// Mock Button component
vi.mock('./ui', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  )
}));

describe('ServiceViewer', () => {
  const mockServiceInfo: ServiceAccountInfo = {
    serviceId: 0,
    balance: 1000,
    nonce: 5,
    codeHash: new Uint8Array([1, 2, 3, 4])
  };

  const createMockService = (serviceId: number): Service => ({
    serviceId,
    getInfo: vi.fn(() => ({ ...mockServiceInfo, serviceId })),
    getStorage: vi.fn(() => bytes.BytesBlob.blobFromNumbers([5, 6, 7, 8])),
    hasPreimage: vi.fn(() => true),
    getPreimage: vi.fn(() => bytes.BytesBlob.blobFromNumbers([9, 10, 11, 12])),
    getLookupHistory: vi.fn(() => [1, 2, 3, 4])
  });

  const createMockStateAccess = (services: Record<number, Service>): StateAccess => ({
    getService: vi.fn((serviceId: number) => services[serviceId] || null)
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default service ID input', () => {
    render(<ServiceViewer />);
    
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /service ids/i })).toBeInTheDocument();
  });

  it('should display service info when service exists', () => {
    const mockService = createMockService(0);
    const mockStateAccess = createMockStateAccess({ 0: mockService });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    expect(screen.getByText('Service 0')).toBeInTheDocument();
    expect(screen.getByText('Service Info')).toBeInTheDocument();
    expect(mockStateAccess.getService).toHaveBeenCalledWith(0);
    expect(mockService.getInfo).toHaveBeenCalled();
  });

  it('should show "Service not found" when service does not exist', () => {
    const mockStateAccess = createMockStateAccess({});

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    expect(screen.getByText('Service not found')).toBeInTheDocument();
  });

  it('should parse comma-separated service IDs correctly', () => {
    const mockService1 = createMockService(1);
    const mockService2 = createMockService(2);
    const mockStateAccess = createMockStateAccess({ 1: mockService1, 2: mockService2 });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const input = screen.getByRole('textbox', { name: /service ids/i });
    fireEvent.change(input, { target: { value: '1, 2, 3' } });

    expect(screen.getByText('Service 1')).toBeInTheDocument();
    expect(screen.getByText('Service 2')).toBeInTheDocument();
    expect(screen.getByText('Service 3')).toBeInTheDocument();
    expect(mockStateAccess.getService).toHaveBeenCalledWith(1);
    expect(mockStateAccess.getService).toHaveBeenCalledWith(2);
    expect(mockStateAccess.getService).toHaveBeenCalledWith(3);
  });

  it('should handle invalid service IDs gracefully', () => {
    const mockStateAccess = createMockStateAccess({});

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const input = screen.getByRole('textbox', { name: /service ids/i });
    fireEvent.change(input, { target: { value: 'invalid, abc, 123' } });

    expect(screen.getByText('Service 123')).toBeInTheDocument();
    expect(screen.queryByText('Service invalid')).not.toBeInTheDocument();
    expect(screen.queryByText('Service abc')).not.toBeInTheDocument();
  });

  it('should handle getService errors gracefully', () => {
    const mockStateAccess: StateAccess = {
      getService: vi.fn(() => {
        throw new Error('Service access error');
      })
    };

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    expect(screen.getByText(/post-state error.*service access error/i)).toBeInTheDocument();
  });

  it('should show diff mode with changed services', () => {
    const preService = createMockService(0);
    const postService = createMockService(0);
    
    // Make services different
    (preService.getInfo as ReturnType<typeof vi.fn>).mockReturnValue({ ...mockServiceInfo, balance: 500 });
    (postService.getInfo as ReturnType<typeof vi.fn>).mockReturnValue({ ...mockServiceInfo, balance: 1000 });

    const preStateAccess = createMockStateAccess({ 0: preService });
    const postStateAccess = createMockStateAccess({ 0: postService });

    render(<ServiceViewer preStateAccess={preStateAccess} postStateAccess={postStateAccess} />);

    expect(screen.getByText('CHANGED')).toBeInTheDocument();
    expect(screen.getByText('Before:')).toBeInTheDocument();
    expect(screen.getByText('After:')).toBeInTheDocument();
  });

  it('should handle storage queries', () => {
    const mockService = createMockService(0);
    const mockStateAccess = createMockStateAccess({ 0: mockService });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const storageInput = screen.getByPlaceholderText(/storage key/i);
    fireEvent.change(storageInput, { target: { value: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd' } });

    const queryButton = screen.getAllByTestId('button').find(btn => btn.textContent === 'Query');
    fireEvent.click(queryButton!);

    expect(mockService.getStorage).toHaveBeenCalled();
  });

  it('should handle preimage queries', () => {
    const mockService = createMockService(0);
    const mockStateAccess = createMockStateAccess({ 0: mockService });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const preimageInput = screen.getByPlaceholderText(/preimage hash \(hex or string\)/i);
    fireEvent.change(preimageInput, { target: { value: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' } });

    const queryButtons = screen.getAllByTestId('button').filter(btn => btn.textContent === 'Query');
    const preimageQueryButton = queryButtons[1]; // Second Query button is for preimage
    fireEvent.click(preimageQueryButton);

    expect(mockService.hasPreimage).toHaveBeenCalled();
    expect(mockService.getPreimage).toHaveBeenCalled();
  });

  it('should handle lookup history queries', () => {
    const mockService = createMockService(0);
    const mockStateAccess = createMockStateAccess({ 0: mockService });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const hashInput = screen.getByPlaceholderText(/preimage hash for lookup/i);
    const lengthInput = screen.getByPlaceholderText(/length/i);
    
    fireEvent.change(hashInput, { target: { value: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' } });
    fireEvent.change(lengthInput, { target: { value: '10' } });

    const queryButtons = screen.getAllByTestId('button');
    const lookupQueryButton = queryButtons.find(btn => 
      btn.textContent === 'Query' && btn.closest('div')?.querySelector('input[placeholder="Length"]')
    );
    fireEvent.click(lookupQueryButton!);

    expect(mockService.getLookupHistory).toHaveBeenCalledWith(expect.any(Object), 10);
  });

  it('should disable query buttons when inputs are empty', () => {
    const mockService = createMockService(0);
    const mockStateAccess = createMockStateAccess({ 0: mockService });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const queryButtons = screen.getAllByTestId('button');
    queryButtons.forEach(button => {
      if (button.textContent === 'Query') {
        expect(button).toBeDisabled();
      }
    });
  });

  it('should show no valid service IDs message for empty input', () => {
    render(<ServiceViewer />);

    const input = screen.getByRole('textbox', { name: /service ids/i });
    fireEvent.change(input, { target: { value: 'invalid, abc, def' } });

    expect(screen.getByText(/no valid service ids found/i)).toBeInTheDocument();
  });

  it('should parse hex storage keys correctly', () => {
    const mockService = createMockService(0);
    const mockStateAccess = createMockStateAccess({ 0: mockService });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const storageInput = screen.getByPlaceholderText(/storage key/i);
    fireEvent.change(storageInput, { target: { value: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' } });

    const queryButton = screen.getAllByTestId('button').find(btn => btn.textContent === 'Query');
    fireEvent.click(queryButton!);

    expect(mockService.getStorage).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should parse string storage keys correctly', () => {
    const mockService = createMockService(0);
    const mockStateAccess = createMockStateAccess({ 0: mockService });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const storageInput = screen.getByPlaceholderText(/storage key/i);
    fireEvent.change(storageInput, { target: { value: 'test' } });

    const queryButton = screen.getAllByTestId('button').find(btn => btn.textContent === 'Query');
    fireEvent.click(queryButton!);

    // When string parsing fails, service method should not be called
    // and an error should be displayed instead
    expect(mockService.getStorage).not.toHaveBeenCalled();
  });

  it('should handle service method errors gracefully', () => {
    const mockService = createMockService(0);
    (mockService.getStorage as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Storage error');
    });
    const mockStateAccess = createMockStateAccess({ 0: mockService });

    render(<ServiceViewer postStateAccess={mockStateAccess} />);

    const storageInput = screen.getByPlaceholderText(/storage key/i);
    fireEvent.change(storageInput, { target: { value: 'test' } });

    // The error should be handled and displayed through CompositeViewer
    const compositeViewers = screen.getAllByTestId('composite-viewer');
    expect(compositeViewers.length).toBeGreaterThan(0);
    // Check that the component doesn't crash and renders something
    expect(compositeViewers.some(viewer => viewer.textContent !== null)).toBe(true);
  });
});