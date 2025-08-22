import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PreimageHashDisplay from './PreimageHashDisplay';

// Mock the serviceUtils
vi.mock('./serviceUtils', () => ({
  calculatePreimageHash: vi.fn((value: string) => `0x${value.slice(2)}hash`)
}));

// Mock the viewer components
vi.mock('../viewer', () => ({
  CompositeViewer: vi.fn(({ value, rawValue, showBytesLength }) => (
    <div data-testid="composite-viewer">
      <div>Value: {String(value)}</div>
      {rawValue && <div>RawValue: {rawValue}</div>}
      {showBytesLength && <div>ShowBytesLength: true</div>}
    </div>
  )),
  ToStringViewer: vi.fn(({ value }) => (
    <div data-testid="tostring-viewer">{String(value)}</div>
  ))
}));

describe('PreimageHashDisplay', () => {
  it('renders CompositeViewer with provided props', () => {
    render(
      <PreimageHashDisplay 
        value="test-value" 
        rawValue="0x1234" 
        showBytesLength={true}
      />
    );

    expect(screen.getByTestId('composite-viewer')).toBeInTheDocument();
    expect(screen.getByText('Value: test-value')).toBeInTheDocument();
    expect(screen.getByText('RawValue: 0x1234')).toBeInTheDocument();
    expect(screen.getByText('ShowBytesLength: true')).toBeInTheDocument();
  });

  it('renders hash section when rawValue is provided', () => {
    render(
      <PreimageHashDisplay 
        value="test-value" 
        rawValue="0x1234"
      />
    );

    expect(screen.getByText('Hash: 0x1234hash')).toBeInTheDocument();
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
  });

  it('does not render hash section when rawValue is not provided', () => {
    render(
      <PreimageHashDisplay 
        value="test-value"
      />
    );

    expect(screen.queryByText(/Hash:/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('tostring-viewer')).not.toBeInTheDocument();
  });

  it('applies normal variant styles by default', () => {
    render(
      <PreimageHashDisplay 
        value="test-value" 
        rawValue="0x1234"
      />
    );

    const borderDiv = screen.getByText('Hash: 0x1234hash').closest('div')?.parentElement;
    expect(borderDiv).toHaveClass('border-gray-200', 'dark:border-gray-600');
  });

  it('applies before variant styles', () => {
    render(
      <PreimageHashDisplay 
        value="test-value" 
        rawValue="0x1234"
        variant="before"
      />
    );

    const borderDiv = screen.getByText('Hash: 0x1234hash').closest('div')?.parentElement;
    expect(borderDiv).toHaveClass('border-red-300', 'dark:border-red-600');
  });

  it('applies after variant styles', () => {
    render(
      <PreimageHashDisplay 
        value="test-value" 
        rawValue="0x1234"
        variant="after"
      />
    );

    const borderDiv = screen.getByText('Hash: 0x1234hash').closest('div')?.parentElement;
    expect(borderDiv).toHaveClass('border-green-300', 'dark:border-green-600');
  });

  it('passes showBytesLength to CompositeViewer', () => {
    render(
      <PreimageHashDisplay 
        value="test-value" 
        showBytesLength={true}
      />
    );

    expect(screen.getByText('ShowBytesLength: true')).toBeInTheDocument();
  });

  it('always passes showBytesLength as true to CompositeViewer', () => {
    render(
      <PreimageHashDisplay 
        value="test-value" 
        showBytesLength={false}
      />
    );

    // Component hardcodes showBytesLength=true, so it should still appear
    expect(screen.getByText('ShowBytesLength: true')).toBeInTheDocument();
  });
});