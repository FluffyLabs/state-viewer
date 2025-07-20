import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HelloWorld from './HelloWorld';

describe('HelloWorld', () => {
  it('renders the main heading correctly', () => {
    render(<HelloWorld />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Hello World!');
  });

  it('renders the welcome message correctly', () => {
    render(<HelloWorld />);
    
    const welcomeText = screen.getByText('Welcome to State View - your app is now running!');
    expect(welcomeText).toBeInTheDocument();
  });

  it('applies the correct CSS classes for layout and styling', () => {
    render(<HelloWorld />);
    
    const container = screen.getByText('Hello World!').closest('div');
    expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'h-full');
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-4xl', 'font-bold', 'text-white', 'mb-4');
    
    const paragraph = screen.getByText('Welcome to State View - your app is now running!');
    expect(paragraph).toHaveClass('text-lg', 'text-gray-300');
  });

  it('renders without crashing', () => {
    const { container } = render(<HelloWorld />);
    expect(container.firstChild).toBeInTheDocument();
  });
});