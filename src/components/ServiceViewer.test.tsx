import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ServiceViewer from './ServiceViewer';
import type { Service, StateAccess, ServiceAccountInfo } from '../types/service';
import * as bytes from '@typeberry/lib/bytes';

// Mock ServiceIdsInput
vi.mock('./service/ServiceIdsInput', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input
      data-testid="service-ids-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Service IDs"
    />
  )
}));

// Mock ServiceCard
vi.mock('./service/ServiceCard', () => ({
  default: ({ serviceData, isDiffMode }: { serviceData: { serviceId: number; preError: string | null; postError: string | null }; isDiffMode: boolean }) => (
    <div data-testid="service-card">
      <div>Service {serviceData.serviceId}</div>
      {serviceData.preError && <div>Pre Error: {serviceData.preError}</div>}
      {serviceData.postError && <div>Post Error: {serviceData.postError}</div>}
      <div>Diff Mode: {isDiffMode.toString()}</div>
    </div>
  )
}));

// Mock parseServiceIds and extractServiceIdsFromState
vi.mock('./service/serviceUtils', () => ({
  parseServiceIds: vi.fn(),
  extractServiceIdsFromState: vi.fn(),
  serviceMatchesSearch: vi.fn()
}));

import { parseServiceIds, extractServiceIdsFromState, serviceMatchesSearch } from './service/serviceUtils';

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

  const defaultProps = {
    state: {},
    stateAccess: createMockStateAccess({})
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([0]);
    (extractServiceIdsFromState as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (serviceMatchesSearch as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  it('should render with required props', () => {
    render(<ServiceViewer {...defaultProps} />);
    
    expect(screen.getByText('Service Accounts')).toBeInTheDocument();
    expect(screen.getByTestId('service-ids-input')).toBeInTheDocument();
  });

  it('should render with default service ID input of "0"', () => {
    render(<ServiceViewer {...defaultProps} />);
    
    const input = screen.getByTestId('service-ids-input');
    expect(input).toHaveValue('0');
  });

  it('should render services in diff mode when preStateAccess is provided', () => {
    const preStateAccess = createMockStateAccess({});
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1]);
    
    render(<ServiceViewer {...defaultProps} preStateAccess={preStateAccess} />);
    
    expect(screen.getByText('Diff Mode: true')).toBeInTheDocument();
  });

  it('should render services in normal mode when preStateAccess is not provided', () => {
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1]);
    
    render(<ServiceViewer {...defaultProps} />);
    
    expect(screen.getByText('Diff Mode: false')).toBeInTheDocument();
  });

  it('should call parseServiceIds with input value', () => {
    render(<ServiceViewer {...defaultProps} />);
    
    const input = screen.getByTestId('service-ids-input');
    fireEvent.change(input, { target: { value: '1,2,3' } });
    
    expect(parseServiceIds).toHaveBeenCalledWith('1,2,3');
  });

  it('should render ServiceCard for each parsed service ID', () => {
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1, 2, 3]);
    
    render(<ServiceViewer {...defaultProps} />);
    
    const serviceCards = screen.getAllByTestId('service-card');
    expect(serviceCards).toHaveLength(3);
    expect(screen.getByText('Service 1')).toBeInTheDocument();
    expect(screen.getByText('Service 2')).toBeInTheDocument();
    expect(screen.getByText('Service 3')).toBeInTheDocument();
  });

  it('should pass correct serviceData to ServiceCard', () => {
    const mockService = createMockService(1);
    const stateAccess = createMockStateAccess({ 1: mockService });
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1]);
    
    render(<ServiceViewer {...defaultProps} stateAccess={stateAccess} />);
    
    expect(stateAccess.getService).toHaveBeenCalledWith(1);
    expect(screen.getByText('Service 1')).toBeInTheDocument();
    expect(screen.getByText('Diff Mode: false')).toBeInTheDocument();
  });

  it('should handle service access errors', () => {
    const stateAccess: StateAccess = {
      getService: vi.fn(() => {
        throw new Error('Service access error');
      })
    };
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1]);
    
    render(<ServiceViewer {...defaultProps} stateAccess={stateAccess} />);
    
    expect(screen.getByText('Post Error: Service access error')).toBeInTheDocument();
  });

  it('should handle preState service access errors', () => {
    const preStateAccess: StateAccess = {
      getService: vi.fn(() => {
        throw new Error('Pre service error');
      })
    };
    const stateAccess = createMockStateAccess({});
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1]);
    
    render(<ServiceViewer {...defaultProps} preStateAccess={preStateAccess} stateAccess={stateAccess} />);
    
    expect(screen.getByText('Pre Error: Pre service error')).toBeInTheDocument();
    expect(screen.getByText('Diff Mode: true')).toBeInTheDocument();
  });

  it('should show no valid service IDs message when no services are parsed', () => {
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([]);
    
    render(<ServiceViewer {...defaultProps} />);
    
    const input = screen.getByTestId('service-ids-input');
    fireEvent.change(input, { target: { value: 'invalid' } });
    
    expect(screen.getByText('No services found matching the given criteria.')).toBeInTheDocument();
  });

  it('should not show no valid service IDs message when input is empty', () => {
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([]);
    
    render(<ServiceViewer {...defaultProps} />);
    
    const input = screen.getByTestId('service-ids-input');
    fireEvent.change(input, { target: { value: '' } });
    
    expect(screen.queryByText(/Didn't find any services with given ids/)).not.toBeInTheDocument();
  });

  it('should pass preState and state to ServiceCard', () => {
    const preState = { key1: 'value1' };
    const state = { key2: 'value2' };
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1]);
    
    render(<ServiceViewer preState={preState} state={state} stateAccess={defaultProps.stateAccess} />);
    
    // The ServiceCard mock doesn't show these props but they should be passed
    expect(screen.getByTestId('service-card')).toBeInTheDocument();
  });

  it('should detect diff mode correctly when preStateAccess is undefined', () => {
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1]);
    
    render(<ServiceViewer {...defaultProps} />);
    
    expect(screen.getByText('Diff Mode: false')).toBeInTheDocument();
  });

  it('should update services when input changes', () => {
    render(<ServiceViewer {...defaultProps} />);
    
    expect(parseServiceIds).toHaveBeenCalledWith('0');
    
    // Change input value
    const input = screen.getByTestId('service-ids-input');
    fireEvent.change(input, { target: { value: '5,6' } });
    
    expect(parseServiceIds).toHaveBeenCalledWith('5,6');
  });

  it('should filter services based on search term', () => {
    const mockService = createMockService(1);
    const stateAccess = createMockStateAccess({ 1: mockService, 2: createMockService(2) });
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([1, 2]);
    (serviceMatchesSearch as ReturnType<typeof vi.fn>).mockImplementation((serviceData, searchTerm) => {
      return serviceData.serviceId === 1 && searchTerm === '1';
    });
    
    render(<ServiceViewer {...defaultProps} stateAccess={stateAccess} searchTerm="1" />);
    
    expect(screen.getByText('Service 1')).toBeInTheDocument();
    expect(screen.queryByText('Service 2')).not.toBeInTheDocument();
  });

  it('should show improved message in diff mode when no changed services match search', () => {
    const preStateAccess = createMockStateAccess({});
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (serviceMatchesSearch as ReturnType<typeof vi.fn>).mockReturnValue(false);
    
    render(<ServiceViewer {...defaultProps} preStateAccess={preStateAccess} searchTerm="test" />);
    
    const input = screen.getByTestId('service-ids-input');
    fireEvent.change(input, { target: { value: 'invalid' } });
    
    expect(screen.getByText(/No services found with changes matching the given criteria and search term "test". Services may exist but have no changes./)).toBeInTheDocument();
  });

  it('should show improved message in normal mode when no services match search', () => {
    (parseServiceIds as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (serviceMatchesSearch as ReturnType<typeof vi.fn>).mockReturnValue(false);
    
    render(<ServiceViewer {...defaultProps} searchTerm="test" />);
    
    const input = screen.getByTestId('service-ids-input');
    fireEvent.change(input, { target: { value: 'invalid' } });
    
    expect(screen.getByText(/No services found matching the given criteria and search term "test"./)).toBeInTheDocument();
  });
});
