import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('should render with default placeholder', () => {
    const mockOnChange = vi.fn();
    render(<SearchInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Search keys or values...');
    expect(input).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const mockOnChange = vi.fn();
    const customPlaceholder = 'Search custom content...';
    
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange} 
        placeholder={customPlaceholder}
      />
    );
    
    const input = screen.getByPlaceholderText(customPlaceholder);
    expect(input).toBeInTheDocument();
  });

  it('should display the correct value', () => {
    const mockOnChange = vi.fn();
    const testValue = 'test search value';
    
    render(<SearchInput value={testValue} onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue(testValue);
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    const mockOnChange = vi.fn();
    
    render(<SearchInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Search keys or values...');
    fireEvent.change(input, { target: { value: 'new search term' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('new search term');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should render search icon', () => {
    const mockOnChange = vi.fn();
    
    render(<SearchInput value="" onChange={mockOnChange} />);
    
    // The search icon should be present in the DOM
    const searchIcon = document.querySelector('.lucide-search');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should apply default CSS classes', () => {
    const mockOnChange = vi.fn();
    
    render(<SearchInput value="" onChange={mockOnChange} />);
    
    const container = document.querySelector('.px-6.py-4.border-b.bg-muted\\/20');
    expect(container).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const mockOnChange = vi.fn();
    const customClass = 'custom-search-class';
    
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange} 
        className={customClass}
      />
    );
    
    const container = document.querySelector(`.${customClass}`);
    expect(container).toBeInTheDocument();
  });

  it('should have proper input styling', () => {
    const mockOnChange = vi.fn();
    
    render(<SearchInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Search keys or values...');
    expect(input).toHaveClass(
      'w-full',
      'pl-10',
      'pr-4',
      'py-2',
      'border',
      'border-border',
      'rounded-lg',
      'focus:ring-2',
      'focus:ring-primary',
      'focus:border-transparent',
      'bg-background',
      'text-foreground'
    );
  });

  it('should handle empty string value', () => {
    const mockOnChange = vi.fn();
    
    render(<SearchInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Search keys or values...');
    expect(input).toHaveValue('');
  });

  it('should handle multiple onChange calls', () => {
    const mockOnChange = vi.fn();
    
    render(<SearchInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Search keys or values...');
    
    fireEvent.change(input, { target: { value: 'first' } });
    fireEvent.change(input, { target: { value: 'second' } });
    fireEvent.change(input, { target: { value: 'third' } });
    
    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'first');
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 'second');
    expect(mockOnChange).toHaveBeenNthCalledWith(3, 'third');
  });
});