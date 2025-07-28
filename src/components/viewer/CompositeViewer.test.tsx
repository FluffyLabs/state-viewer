import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CompositeViewer from './CompositeViewer';

// Mock the child components
vi.mock('./ArrayViewer', () => ({
  default: vi.fn(({ array }) => <div data-testid="array-viewer">Array with {array.length} items</div>)
}));

vi.mock('./ObjectViewer', () => ({
  default: vi.fn(({ value }) => <div data-testid="object-viewer">Object with {Object.keys(value).length} keys</div>)
}));

vi.mock('./ToStringViewer', () => ({
  default: vi.fn(({ value }) => <div data-testid="tostring-viewer">{String(value)}</div>)
}));

describe('CompositeViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render null value with special styling', () => {
    render(<CompositeViewer value={null} />);
    
    const nullElement = screen.getByText('null');
    expect(nullElement).toBeInTheDocument();
    expect(nullElement).toHaveClass('text-gray-500', 'italic');
  });

  it('should render ArrayViewer for arrays', () => {
    const arrayValue = [1, 2, 3];
    render(<CompositeViewer value={arrayValue} />);
    
    expect(screen.getByTestId('array-viewer')).toBeInTheDocument();
    expect(screen.getByText('Array with 3 items')).toBeInTheDocument();
  });

  it('should render ArrayViewer for empty arrays', () => {
    render(<CompositeViewer value={[]} />);
    
    expect(screen.getByTestId('array-viewer')).toBeInTheDocument();
    expect(screen.getByText('Array with 0 items')).toBeInTheDocument();
  });

  it('should render ToStringViewer for objects with toJSON method', () => {
    const objWithToJSON = {
      value: 'test',
      toJSON: () => ({ serialized: true })
    };
    render(<CompositeViewer value={objWithToJSON} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
  });

  it('should render ObjectViewer for plain objects', () => {
    const plainObject = { key1: 'value1', key2: 'value2' };
    render(<CompositeViewer value={plainObject} />);
    
    expect(screen.getByTestId('object-viewer')).toBeInTheDocument();
    expect(screen.getByText('Object with 2 keys')).toBeInTheDocument();
  });

  it('should render ObjectViewer for empty objects', () => {
    render(<CompositeViewer value={{}} />);
    
    expect(screen.getByTestId('object-viewer')).toBeInTheDocument();
    expect(screen.getByText('Object with 0 keys')).toBeInTheDocument();
  });

  it('should render ToStringViewer for primitive values', () => {
    render(<CompositeViewer value="string value" />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
    expect(screen.getByText('string value')).toBeInTheDocument();
  });

  it('should render ToStringViewer for numbers', () => {
    render(<CompositeViewer value={42} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render ToStringViewer for booleans', () => {
    render(<CompositeViewer value={true} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('should render ToStringViewer for undefined', () => {
    render(<CompositeViewer value={undefined} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
    expect(screen.getByText('undefined')).toBeInTheDocument();
  });

  it('should render ToStringViewer for objects with custom toString', () => {
    const objWithCustomToString = {
      value: 'test',
      toString: () => 'custom string representation'
    };
    render(<CompositeViewer value={objWithCustomToString} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
  });

  it('should handle Date objects correctly', () => {
    const dateValue = new Date('2023-01-01');
    render(<CompositeViewer value={dateValue} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
  });

  it('should handle RegExp objects correctly', () => {
    const regexValue = /test/g;
    render(<CompositeViewer value={regexValue} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
  });

  it('should handle Error objects correctly', () => {
    const errorValue = new Error('test error');
    render(<CompositeViewer value={errorValue} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
  });

  it('should handle nested objects correctly', () => {
    const nestedObject = {
      level1: {
        level2: {
          value: 'deep'
        }
      }
    };
    render(<CompositeViewer value={nestedObject} />);
    
    expect(screen.getByTestId('object-viewer')).toBeInTheDocument();
  });

  it('should handle objects with prototype methods', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function CustomClass(this: any) {
      this.property = 'value';
    }
    CustomClass.prototype.method = function() { return 'method'; };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = new (CustomClass as any)();
    render(<CompositeViewer value={instance} />);
    
    // Should render as ObjectViewer since it has default toString behavior
    expect(screen.getByTestId('object-viewer')).toBeInTheDocument();
  });

  it('should handle Map objects', () => {
    const mapValue = new Map([['key', 'value']]);
    render(<CompositeViewer value={mapValue} />);
    
    expect(screen.getByTestId('object-viewer')).toBeInTheDocument();
  });

  it('should handle Set objects', () => {
    const setValue = new Set([1, 2, 3]);
    render(<CompositeViewer value={setValue} />);
    
    expect(screen.getByTestId('object-viewer')).toBeInTheDocument();
  });

  it('should handle functions', () => {
    const functionValue = function testFunction() { return 'test'; };
    render(<CompositeViewer value={functionValue} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
  });

  it('should handle symbols', () => {
    const symbolValue = Symbol('test');
    render(<CompositeViewer value={symbolValue} />);
    
    expect(screen.getByTestId('tostring-viewer')).toBeInTheDocument();
  });
});