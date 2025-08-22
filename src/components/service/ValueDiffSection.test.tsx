import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ValueDiffSection from './ValueDiffSection';

// Mock the ValueDisplay component
vi.mock('./ValueDisplay', () => ({
  default: vi.fn(({ value, rawValue, showBytesLength, showModeToggle, variant }) => (
    <div data-testid="value-display">
      <div>Value: {String(value)}</div>
      {rawValue && <div>RawValue: {rawValue}</div>}
      {showBytesLength && <div>ShowBytesLength: true</div>}
      {showModeToggle && <div>ShowModeToggle: true</div>}
      <div>Variant: {variant}</div>
    </div>
  ))
}));

describe('ValueDiffSection', () => {
  it('renders with before variant', () => {
    render(
      <ValueDiffSection
        title="Before:"
        value="test-value"
        rawValue="0x1234"
        variant="before"
      />
    );

    expect(screen.getByText('Before:')).toBeInTheDocument();
    expect(screen.getByTestId('value-display')).toBeInTheDocument();
    expect(screen.getByText('Value: test-value')).toBeInTheDocument();
    expect(screen.getByText('RawValue: 0x1234')).toBeInTheDocument();
    expect(screen.getByText('Variant: before')).toBeInTheDocument();
  });

  it('renders with after variant', () => {
    render(
      <ValueDiffSection
        title="After:"
        value="test-value"
        rawValue="0x1234"
        variant="after"
      />
    );

    expect(screen.getByText('After:')).toBeInTheDocument();
    expect(screen.getByTestId('value-display')).toBeInTheDocument();
    expect(screen.getByText('Variant: after')).toBeInTheDocument();
  });

  it('applies before variant styles', () => {
    render(
      <ValueDiffSection
        title="Before:"
        value="test-value"
        rawValue="0x1234"
        variant="before"
      />
    );

    const title = screen.getByText('Before:');
    expect(title).toHaveClass('text-red-700', 'dark:text-red-400');

    const container = screen.getByTestId('value-display').parentElement;
    expect(container).toHaveClass(
      'bg-red-50',
      'dark:bg-red-900/20',
      'border-red-200',
      'dark:border-red-700'
    );
  });

  it('applies after variant styles', () => {
    render(
      <ValueDiffSection
        title="After:"
        value="test-value"
        rawValue="0x1234"
        variant="after"
      />
    );

    const title = screen.getByText('After:');
    expect(title).toHaveClass('text-green-700', 'dark:text-green-400');

    const container = screen.getByTestId('value-display').parentElement;
    expect(container).toHaveClass(
      'bg-green-50',
      'dark:bg-green-900/20',
      'border-green-200',
      'dark:border-green-700'
    );
  });

  it('returns null when rawValue is not provided', () => {
    const { container } = render(
      <ValueDiffSection
        title="Test:"
        value="test-value"
        variant="before"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('passes showBytesLength to ValueDisplay', () => {
    render(
      <ValueDiffSection
        title="Test:"
        value="test-value"
        rawValue="0x1234"
        variant="before"
        showBytesLength={true}
      />
    );

    expect(screen.getByText('ShowBytesLength: true')).toBeInTheDocument();
  });

  it('passes showModeToggle to ValueDisplay', () => {
    render(
      <ValueDiffSection
        title="Test:"
        value="test-value"
        rawValue="0x1234"
        variant="before"
        showModeToggle={true}
      />
    );

    expect(screen.getByText('ShowModeToggle: true')).toBeInTheDocument();
  });

  it('defaults showBytesLength to false', () => {
    render(
      <ValueDiffSection
        title="Test:"
        value="test-value"
        rawValue="0x1234"
        variant="before"
      />
    );

    expect(screen.queryByText('ShowBytesLength: true')).not.toBeInTheDocument();
  });

  it('defaults showModeToggle to false', () => {
    render(
      <ValueDiffSection
        title="Test:"
        value="test-value"
        rawValue="0x1234"
        variant="before"
      />
    );

    expect(screen.queryByText('ShowModeToggle: true')).not.toBeInTheDocument();
  });

  it('renders with all props', () => {
    render(
      <ValueDiffSection
        title="Complete Test:"
        value="complex-value"
        rawValue="0xabcd"
        variant="after"
        showBytesLength={true}
        showModeToggle={true}
      />
    );

    expect(screen.getByText('Complete Test:')).toBeInTheDocument();
    expect(screen.getByText('Value: complex-value')).toBeInTheDocument();
    expect(screen.getByText('RawValue: 0xabcd')).toBeInTheDocument();
    expect(screen.getByText('Variant: after')).toBeInTheDocument();
    expect(screen.getByText('ShowBytesLength: true')).toBeInTheDocument();
    expect(screen.getByText('ShowModeToggle: true')).toBeInTheDocument();
  });
});