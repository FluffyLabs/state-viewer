import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ToStringViewer from './ToStringViewer';

describe('ToStringViewer', () => {
  it('should render null value with special styling', () => {
    render(<ToStringViewer value={null} />);
    
    const nullElement = screen.getByText('null');
    expect(nullElement).toBeInTheDocument();
    expect(nullElement).toHaveClass('text-gray-500', 'italic');
  });

  it('should render string values', () => {
    render(<ToStringViewer value="Hello World" />);
    
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render number values as strings', () => {
    render(<ToStringViewer value={42} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render boolean values as strings', () => {
    render(<ToStringViewer value={true} />);
    
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('should render object values as strings', () => {
    const obj = { key: 'value' };
    render(<ToStringViewer value={obj} />);
    
    expect(screen.getByText('[object Object]')).toBeInTheDocument();
  });

  it('should render array values as strings', () => {
    const arr = [1, 2, 3];
    render(<ToStringViewer value={arr} />);
    
    expect(screen.getByText('1,2,3')).toBeInTheDocument();
  });

  it('should render undefined as string', () => {
    render(<ToStringViewer value={undefined} />);
    
    expect(screen.getByText('undefined')).toBeInTheDocument();
  });

  it('should have proper CSS classes', () => {
    const { container } = render(<ToStringViewer value="test" />);
    
    const preElement = container.querySelector('pre');
    expect(preElement).toHaveClass(
      'mt-1',
      'pl-2',
      'text-xs',
      'font-mono',
      'bg-gray-50',
      'rounded',
      'p-2',
      'break-all',
      'overflow-auto'
    );
  });

  it('should render empty string', () => {
    const { container } = render(<ToStringViewer value="" />);
    
    const preElement = container.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement?.textContent).toBe('');
  });

  it('should render multiline strings correctly', () => {
    const multilineString = 'Line 1\nLine 2\nLine 3';
    const { container } = render(<ToStringViewer value={multilineString} />);
    
    const preElement = container.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement?.textContent).toBe(multilineString);
  });

  it('should render special characters correctly', () => {
    const specialChars = 'Special chars: @#$%^&*()[]{}';
    render(<ToStringViewer value={specialChars} />);
    
    expect(screen.getByText(specialChars)).toBeInTheDocument();
  });

  it('should render very long strings', () => {
    const longString = 'a'.repeat(1000);
    render(<ToStringViewer value={longString} />);
    
    expect(screen.getByText(longString)).toBeInTheDocument();
  });
});