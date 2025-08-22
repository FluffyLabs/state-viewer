import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ValueDisplay from './ValueDisplay';

// Mock the viewer components
vi.mock('../viewer', () => ({
  CompositeViewer: vi.fn(({ value, rawValue, showBytesLength, showModeToggle }) => (
    <div data-testid="composite-viewer">
      <div>Value: {String(value)}</div>
      {rawValue && <div>RawValue: {rawValue}</div>}
      {showBytesLength && <div>ShowBytesLength: true</div>}
      {showModeToggle && <div>ShowModeToggle: true</div>}
    </div>
  ))
}));

describe('ValueDisplay', () => {
  it('renders CompositeViewer with provided props', () => {
    render(
      <ValueDisplay 
        value="test-value" 
        rawValue="0x1234" 
        showBytesLength={true}
        showModeToggle={true}
      />
    );

    expect(screen.getByTestId('composite-viewer')).toBeInTheDocument();
    expect(screen.getByText('Value: test-value')).toBeInTheDocument();
    expect(screen.getByText('RawValue: 0x1234')).toBeInTheDocument();
    expect(screen.getByText('ShowBytesLength: true')).toBeInTheDocument();
    expect(screen.getByText('ShowModeToggle: true')).toBeInTheDocument();
  });

  it('applies normal variant styles by default', () => {
    render(
      <ValueDisplay 
        value="test-value" 
        rawValue="0x1234"
      />
    );

    const borderDiv = screen.getByTestId('composite-viewer').parentElement;
    expect(borderDiv).toHaveClass('border-gray-200', 'dark:border-gray-600');
  });

  it('applies normal variant styles explicitly', () => {
    render(
      <ValueDisplay 
        value="test-value" 
        rawValue="0x1234"
        variant="normal"
      />
    );

    const borderDiv = screen.getByTestId('composite-viewer').parentElement;
    expect(borderDiv).toHaveClass('border-gray-200', 'dark:border-gray-600');
  });

  it('applies before variant styles', () => {
    render(
      <ValueDisplay 
        value="test-value" 
        rawValue="0x1234"
        variant="before"
      />
    );

    const borderDiv = screen.getByTestId('composite-viewer').parentElement;
    expect(borderDiv).toHaveClass('border-red-300', 'dark:border-red-600');
  });

  it('applies after variant styles', () => {
    render(
      <ValueDisplay 
        value="test-value" 
        rawValue="0x1234"
        variant="after"
      />
    );

    const borderDiv = screen.getByTestId('composite-viewer').parentElement;
    expect(borderDiv).toHaveClass('border-green-300', 'dark:border-green-600');
  });

  it('defaults showBytesLength to false', () => {
    render(
      <ValueDisplay 
        value="test-value"
      />
    );

    expect(screen.queryByText('ShowBytesLength: true')).not.toBeInTheDocument();
  });

  it('defaults showModeToggle to false', () => {
    render(
      <ValueDisplay 
        value="test-value"
      />
    );

    expect(screen.queryByText('ShowModeToggle: true')).not.toBeInTheDocument();
  });

  it('works without rawValue', () => {
    render(
      <ValueDisplay 
        value="test-value"
      />
    );

    expect(screen.getByTestId('composite-viewer')).toBeInTheDocument();
    expect(screen.getByText('Value: test-value')).toBeInTheDocument();
    expect(screen.queryByText(/RawValue:/)).not.toBeInTheDocument();
  });

  it('passes showBytesLength when true', () => {
    render(
      <ValueDisplay 
        value="test-value" 
        showBytesLength={true}
      />
    );

    expect(screen.getByText('ShowBytesLength: true')).toBeInTheDocument();
  });

  it('passes showModeToggle when true', () => {
    render(
      <ValueDisplay 
        value="test-value" 
        showModeToggle={true}
      />
    );

    expect(screen.getByText('ShowModeToggle: true')).toBeInTheDocument();
  });
});