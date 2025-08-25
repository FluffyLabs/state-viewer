import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ServiceCard from './ServiceCard';
import type { ServiceData, RawState } from './types';
import { Service } from '@/types/service';

// Mock the query components - they are called as functions and return render objects
vi.mock('./StorageQuery', () => ({
  default: vi.fn(() => ({
    renderQueryInput: () => <div data-testid="storage-input">Storage Input</div>,
    renderResults: () => <div data-testid="storage-results">Storage Results</div>
  }))
}));

vi.mock('./PreimageQuery', () => ({
  default: vi.fn(() => ({
    renderQueryInput: () => <div data-testid="preimage-input">Preimage Input</div>,
    renderResults: () => <div data-testid="preimage-results">Preimage Results</div>
  }))
}));

vi.mock('./LookupHistoryQuery', () => ({
  default: vi.fn(() => ({
    renderQueryInput: () => <div data-testid="lookup-input">Lookup History Input</div>,
    renderResults: () => <div data-testid="lookup-results">Lookup History Results</div>
  }))
}));

vi.mock('./ServiceInfo', () => ({
  default: () => <div data-testid="service-info">Service Info</div>
}));

vi.mock('./ServiceError', () => ({
  default: () => <div data-testid="service-error">Service Error</div>
}));

describe('ServiceCard', () => {
  const mockService: Service = {
    serviceId: 1,
    getInfo: () => ({
      serviceId: 1,
      balance: 1000,
      nonce: 0,
      codeHash: new Uint8Array([0x12, 0x34, 0x56, 0x78])
    }),
    getStorage: () => null,
    hasPreimage: () => false,
    getPreimage: () => null,
    getLookupHistory: () => null
  };

  const mockState: RawState = {
    '0xabcdef': '0x123456'
  };

  const createMockServiceData = (overrides?: Partial<ServiceData>): ServiceData => ({
    serviceId: 1,
    preService: null,
    postService: mockService,
    preError: null,
    postError: null,
    ...overrides
  });

  it('renders service card with tabs', () => {
    const serviceData = createMockServiceData();
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        isDiffMode={false}
      />
    );

    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aₛ Storage/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aₚ Preimages/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aₗ Lookup History/ })).toBeInTheDocument();
    expect(screen.getByTestId('service-info')).toBeInTheDocument();
  });

  it('shows storage tab as active by default', () => {
    const serviceData = createMockServiceData();
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        isDiffMode={false}
      />
    );

    const storageTab = screen.getByRole('tab', { name: /aₛ Storage/ });
    expect(storageTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('storage-input')).toBeInTheDocument();
    expect(screen.getByTestId('storage-results')).toBeInTheDocument();
  });

  it('switches to preimages tab when clicked', () => {
    const serviceData = createMockServiceData();
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        isDiffMode={false}
      />
    );

    const preimagesTab = screen.getByRole('tab', { name: /aₚ Preimages/ });
    fireEvent.click(preimagesTab);

    expect(preimagesTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('preimage-input')).toBeInTheDocument();
    expect(screen.getByTestId('preimage-results')).toBeInTheDocument();
    expect(screen.queryByTestId('storage-results')).not.toBeInTheDocument();
  });

  it('switches to lookup history tab when clicked', () => {
    const serviceData = createMockServiceData();
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        isDiffMode={false}
      />
    );

    const lookupHistoryTab = screen.getByRole('tab', { name: /aₗ Lookup History/ });
    fireEvent.click(lookupHistoryTab);

    expect(lookupHistoryTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('lookup-input')).toBeInTheDocument();
    expect(screen.getByTestId('lookup-results')).toBeInTheDocument();
    expect(screen.queryByTestId('storage-results')).not.toBeInTheDocument();
  });

  it('renders service error when present', () => {
    const serviceData = createMockServiceData();
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        isDiffMode={false}
      />
    );

    expect(screen.getByTestId('service-error')).toBeInTheDocument();
  });

  it('shows "Service not found" when postService is null and no errors', () => {
    const serviceData = createMockServiceData({
      preService: mockService, // preService exists but postService is null
      postService: null,
      preError: null,
      postError: null
    });
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        isDiffMode={false}
      />
    );

    expect(screen.getByText('Service not found')).toBeInTheDocument();
  });

  it('returns null when activeService is null', () => {
    const serviceData = createMockServiceData({
      preService: null,
      postService: null
    });
    
    const { container } = render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        isDiffMode={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays change type badge in diff mode', () => {
    const serviceData = createMockServiceData({
      preService: null,
      postService: mockService
    });
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        preState={mockState}
        isDiffMode={true}
      />
    );

    expect(screen.getByText('ADDED')).toBeInTheDocument();
  });

  it('applies correct background class for different change types', () => {
    const serviceData = createMockServiceData({
      preService: null,
      postService: mockService
    });
    
    const { container } = render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        preState={mockState}
        isDiffMode={true}
      />
    );

    const serviceCard = container.firstChild as HTMLElement;
    expect(serviceCard).toHaveClass('bg-green-100');
  });

  it('shows correct input for each tab', () => {
    const serviceData = createMockServiceData();
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        isDiffMode={false}
      />
    );

    // Initially storage input should be visible
    expect(screen.getByTestId('storage-input')).toBeInTheDocument();
    expect(screen.queryByTestId('preimage-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lookup-input')).not.toBeInTheDocument();

    // Switch to preimages
    fireEvent.click(screen.getByRole('tab', { name: /aₚ Preimages/ }));
    expect(screen.getByTestId('preimage-input')).toBeInTheDocument();
    expect(screen.queryByTestId('storage-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lookup-input')).not.toBeInTheDocument();

    // Switch to lookup history
    fireEvent.click(screen.getByRole('tab', { name: /aₗ Lookup History/ }));
    expect(screen.getByTestId('lookup-input')).toBeInTheDocument();
    expect(screen.queryByTestId('storage-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('preimage-input')).not.toBeInTheDocument();
  });

  it('renders all tab components correctly', () => {
    const serviceData = createMockServiceData();
    
    render(
      <ServiceCard 
        serviceData={serviceData}
        state={mockState}
        preState={mockState}
        isDiffMode={true}
      />
    );

    // Check that storage tab is active initially
    expect(screen.getByTestId('storage-input')).toBeInTheDocument();
    expect(screen.getByTestId('storage-results')).toBeInTheDocument();
    
    // Switch tabs and verify content changes
    fireEvent.click(screen.getByRole('tab', { name: /aₚ Preimages/ }));
    expect(screen.getByTestId('preimage-input')).toBeInTheDocument();
    expect(screen.getByTestId('preimage-results')).toBeInTheDocument();
    
    // Switch to lookup history tab
    fireEvent.click(screen.getByRole('tab', { name: /aₗ Lookup History/ }));
    expect(screen.getByTestId('lookup-input')).toBeInTheDocument();
    expect(screen.getByTestId('lookup-results')).toBeInTheDocument();
  });
});
