import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ArrayViewer from './ArrayViewer';

describe('ArrayViewer', () => {
  const mockRenderValue = vi.fn((value) => <div data-testid="rendered-value">{String(value)}</div>);

  beforeEach(() => {
    mockRenderValue.mockClear();
  });

  it('should render array length', () => {
    const array = [1, 2, 3];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(screen.getByText('Array (3 items)')).toBeInTheDocument();
  });

  it('should render empty array', () => {
    render(<ArrayViewer array={[]} renderValue={mockRenderValue} />);
    
    expect(screen.getByText('Array (0 items)')).toBeInTheDocument();
  });

  it('should render array items with indices', () => {
    const array = ['first', 'second', 'third'];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/\[0\] first/)).toBeInTheDocument();
    expect(screen.getByText(/\[1\] second/)).toBeInTheDocument();
    expect(screen.getByText(/\[2\] third/)).toBeInTheDocument();
  });

  it('should handle null values in array', () => {
    const array = [null, 'value', null];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/\[0\] null/)).toBeInTheDocument();
    expect(screen.getByText(/\[1\] value/)).toBeInTheDocument();
    expect(screen.getByText(/\[2\] null/)).toBeInTheDocument();
  });

  it('should show {...} for object values', () => {
    const array = [{ key: 'value' }, 'string'];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/\[0\] \{...\}/)).toBeInTheDocument();
    expect(screen.getByText(/\[1\] string/)).toBeInTheDocument();
  });

  it('should truncate long string values in summary', () => {
    const longString = 'a'.repeat(100);
    const array = [longString];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    const summaryText = screen.getByText(/\[0\] aaaaaaaaaa.*\.\.\./);
    expect(summaryText).toBeInTheDocument();
  });

  it('should not truncate short string values', () => {
    const shortString = 'short';
    const array = [shortString];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/\[0\] short/)).toBeInTheDocument();
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });

  it('should call renderValue for each array item', () => {
    const array = ['item1', 'item2'];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(mockRenderValue).toHaveBeenCalledTimes(2);
    expect(mockRenderValue).toHaveBeenCalledWith('item1');
    expect(mockRenderValue).toHaveBeenCalledWith('item2');
  });

  it('should have proper CSS classes', () => {
    const array = ['test'];
    const { container } = render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    const mainDiv = container.querySelector('.space-y-1');
    expect(mainDiv).toBeInTheDocument();
    
    const lengthDiv = container.querySelector('.text-xs.text-gray-500.mb-2');
    expect(lengthDiv).toBeInTheDocument();
    
    const detailsElement = container.querySelector('details.border-l-2.border-gray-200.pl-2');
    expect(detailsElement).toBeInTheDocument();
    
    const summaryElement = container.querySelector('summary.cursor-pointer.text-xs.text-gray-600.hover\\:text-gray-800');
    expect(summaryElement).toBeInTheDocument();
  });

  it('should handle mixed data types', () => {
    const array = [42, true, null, { obj: true }, [1, 2]];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/\[0\] 42/)).toBeInTheDocument();
    expect(screen.getByText(/\[1\] true/)).toBeInTheDocument();
    expect(screen.getByText(/\[2\] null/)).toBeInTheDocument();
    expect(screen.getByText(/\[3\] \{...\}/)).toBeInTheDocument();
    expect(screen.getByText(/\[4\] \[1, 2\]/)).toBeInTheDocument();
  });

  it('should render details elements as collapsible', () => {
    const array = ['item1', 'item2'];
    const { container } = render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    const detailsElements = container.querySelectorAll('details');
    expect(detailsElements).toHaveLength(2);
    
    detailsElements.forEach(details => {
      expect(details).toBeInTheDocument();
      expect(details.querySelector('summary')).toBeInTheDocument();
    });
  });

  it('should handle single item array', () => {
    const array = ['single'];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(screen.getByText('Array (1 items)')).toBeInTheDocument();
    expect(screen.getByText(/\[0\] single/)).toBeInTheDocument();
    expect(mockRenderValue).toHaveBeenCalledWith('single');
  });

  it('should handle array with undefined values', () => {
    const array = [undefined, 'defined'];
    render(<ArrayViewer array={array} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/\[0\] undefined/)).toBeInTheDocument();
    expect(screen.getByText(/\[1\] defined/)).toBeInTheDocument();
  });
});