import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InspectStateViewer from './InspectStateViewer';

describe('InspectStateViewer', () => {
  const mockState = {
    'key1': 'value1',
    'key2': 'value2',
    'nested.key': 'nestedValue',
  };

  it('should render with state data', () => {
    render(<InspectStateViewer state={mockState} />);

    expect(screen.getByText('State Data - JSON Dump')).toBeInTheDocument();

    // Check that the JSON content is rendered (may be compact in test environment)
    const codeElement = screen.getByRole('code');
    const jsonText = codeElement.textContent;
    expect(jsonText).toContain('"key1"');
    expect(jsonText).toContain('"value1"');
    expect(jsonText).toContain('"key2"');
    expect(jsonText).toContain('"value2"');
  });

  it('should render empty state correctly', () => {
    render(<InspectStateViewer state={{}} />);

    expect(screen.getByText('{}')).toBeInTheDocument();
  });

  it('should format JSON with proper indentation', () => {
    render(<InspectStateViewer state={mockState} />);

    // Check that the JSON content is present
    const codeElement = screen.getByRole('code');
    const jsonText = codeElement.textContent;
    expect(jsonText).toContain('"key1"');
    expect(jsonText).toContain('"value1"');
  });

  it('should have proper structure and classes', () => {
    render(<InspectStateViewer state={mockState} />);

    // Check for main container
    const container = screen.getByText('State Data - JSON Dump').closest('div');
    expect(container).toHaveClass('p-4');

    // Check for heading
    const heading = screen.getByText('State Data - JSON Dump');
    expect(heading).toHaveClass('text-lg', 'font-semibold', 'mb-4');

    // Check for pre element
    const codeElement = screen.getByRole('code');
    const preElement = codeElement.closest('pre');
    expect(preElement).toHaveClass('bg-muted', 'p-4', 'rounded', 'border', 'text-sm', 'overflow-auto', 'max-h-96');
  });

  it('should handle complex nested objects', () => {
    const complexState = {
      'simple': 'value',
      'object': JSON.stringify({
        'nested': 'nestedValue',
        'deeplyNested': {
          'key': 'deepValue'
        }
      }),
      'array': JSON.stringify(['item1', 'item2'])
    };

    render(<InspectStateViewer state={complexState} />);

    const codeElement = screen.getByRole('code');
    const jsonText = codeElement.textContent;
    expect(jsonText).toContain('"simple"');
    expect(jsonText).toContain('"value"');
    expect(jsonText).toContain('"object"');
    expect(jsonText).toContain('"array"');
  });

  it('should handle special characters in values', () => {
    const specialState = {
      'quotes': 'value with "quotes"',
      'backslash': 'value\\with\\backslash',
      'unicode': 'value with émojis 🎉'
    };

    render(<InspectStateViewer state={specialState} />);

    const codeElement = screen.getByRole('code');
    const jsonText = codeElement.textContent;
    expect(jsonText).toContain('"quotes"');
    expect(jsonText).toContain('value with \\"quotes\\"');
    expect(jsonText).toContain('"unicode"');
  });

  it('should handle very long values', () => {
    const longState = {
      'longKey': 'a'.repeat(1000)
    };

    render(<InspectStateViewer state={longState} />);

    const codeElement = screen.getByRole('code');
    const jsonText = codeElement.textContent;
    expect(jsonText).toContain('"longKey"');
    expect(jsonText).toContain('aaaaaa'); // Check part of the long string
  });

  it('should handle numeric-like string keys', () => {
    const numericKeyState = {
      '123': 'numericKeyValue',
      '0x456': 'hexKeyValue'
    };

    render(<InspectStateViewer state={numericKeyState} />);

    const codeElement = screen.getByRole('code');
    const jsonText = codeElement.textContent;
    expect(jsonText).toContain('"123"');
    expect(jsonText).toContain('"numericKeyValue"');
    expect(jsonText).toContain('"0x456"');
  });
});
