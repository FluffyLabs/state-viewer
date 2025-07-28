import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ObjectViewer from './ObjectViewer';

describe('ObjectViewer', () => {
  const mockRenderValue = vi.fn((value) => <div data-testid="rendered-value">{String(value)}</div>);

  beforeEach(() => {
    mockRenderValue.mockClear();
  });

  it('should render empty object', () => {
    render(<ObjectViewer value={{}} renderValue={mockRenderValue} />);
    
    const container = document.querySelector('.space-y-1');
    expect(container).toBeInTheDocument();
    expect(container?.children).toHaveLength(0);
  });

  it('should render object keys and values', () => {
    const obj = { key1: 'value1', key2: 'value2' };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/key1: value1/)).toBeInTheDocument();
    expect(screen.getByText(/key2: value2/)).toBeInTheDocument();
  });

  it('should handle null values', () => {
    const obj = { nullKey: null, regularKey: 'value' };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/nullKey: null/)).toBeInTheDocument();
    expect(screen.getByText(/regularKey: value/)).toBeInTheDocument();
  });

  it('should show {...} for nested object values', () => {
    const obj = { nested: { inner: 'value' }, simple: 'text' };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/nested: \{...\}/)).toBeInTheDocument();
    expect(screen.getByText(/simple: text/)).toBeInTheDocument();
  });

  it('should truncate long string values in summary', () => {
    const longString = 'a'.repeat(100);
    const obj = { longKey: longString };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    const summaryText = screen.getByText(/longKey: aaaaaaaaaa.*\.\.\./);
    expect(summaryText).toBeInTheDocument();
  });

  it('should not truncate short string values', () => {
    const obj = { shortKey: 'short' };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/shortKey: short/)).toBeInTheDocument();
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });

  it('should call renderValue for each object value', () => {
    const obj = { key1: 'value1', key2: 'value2' };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(mockRenderValue).toHaveBeenCalledTimes(2);
    expect(mockRenderValue).toHaveBeenCalledWith('value1');
    expect(mockRenderValue).toHaveBeenCalledWith('value2');
  });

  it('should have proper CSS classes', () => {
    const obj = { key: 'value' };
    const { container } = render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    const mainDiv = container.querySelector('.space-y-1');
    expect(mainDiv).toBeInTheDocument();
    
    const detailsElement = container.querySelector('details.border-l-2.border-gray-200.pl-2');
    expect(detailsElement).toBeInTheDocument();
    
    const summaryElement = container.querySelector('summary.cursor-pointer.text-xs.text-gray-600.hover\\:text-gray-800');
    expect(summaryElement).toBeInTheDocument();
  });

  it('should handle mixed data types', () => {
    const obj = {
      stringKey: 'text',
      numberKey: 42,
      booleanKey: true,
      nullKey: null,
      undefinedKey: undefined,
      objectKey: { nested: true },
      arrayKey: [1, 2, 3]
    };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/stringKey: text/)).toBeInTheDocument();
    expect(screen.getByText(/numberKey: 42/)).toBeInTheDocument();
    expect(screen.getByText(/booleanKey: true/)).toBeInTheDocument();
    expect(screen.getByText(/nullKey: null/)).toBeInTheDocument();
    expect(screen.getByText(/undefinedKey: undefined/)).toBeInTheDocument();
    expect(screen.getByText(/objectKey: \{...\}/)).toBeInTheDocument();
    expect(screen.getByText(/arrayKey: \[1, 2, 3\]/)).toBeInTheDocument();
  });

  it('should render details elements as collapsible', () => {
    const obj = { key1: 'value1', key2: 'value2' };
    const { container } = render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    const detailsElements = container.querySelectorAll('details');
    expect(detailsElements).toHaveLength(2);
    
    detailsElements.forEach(details => {
      expect(details).toBeInTheDocument();
      expect(details.querySelector('summary')).toBeInTheDocument();
    });
  });

  it('should handle single property object', () => {
    const obj = { singleKey: 'singleValue' };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/singleKey: singleValue/)).toBeInTheDocument();
    expect(mockRenderValue).toHaveBeenCalledWith('singleValue');
  });

  it('should handle object with numeric keys', () => {
    const obj = { '123': 'numericKey', 'normalKey': 'normalValue' };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/123: numericKey/)).toBeInTheDocument();
    expect(screen.getByText(/normalKey: normalValue/)).toBeInTheDocument();
  });

  it('should handle object with special character keys', () => {
    const obj = { 'key-with-dashes': 'value', 'key.with.dots': 'value2' };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/key-with-dashes: value/)).toBeInTheDocument();
    expect(screen.getByText(/key\.with\.dots: value2/)).toBeInTheDocument();
  });

  it('should preserve key order', () => {
    const obj = { c: '3', a: '1', b: '2' };
    const { container } = render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    const summaries = container.querySelectorAll('summary');
    expect(summaries[0]).toHaveTextContent(/c: 3/);
    expect(summaries[1]).toHaveTextContent(/a: 1/);
    expect(summaries[2]).toHaveTextContent(/b: 2/);
  });

  it('should handle deeply nested objects in preview', () => {
    const deepObject = { level1: { level2: { level3: 'deep' } } };
    const obj = { nested: deepObject };
    render(<ObjectViewer value={obj} renderValue={mockRenderValue} />);
    
    expect(screen.getByText(/nested: \{...\}/)).toBeInTheDocument();
    expect(mockRenderValue).toHaveBeenCalledWith(deepObject);
  });
});