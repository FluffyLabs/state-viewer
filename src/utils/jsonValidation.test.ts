import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateJsonFile } from './jsonValidation';

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  error: Error | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsText(/* file: File */) {
    // Simulate async behavior
    setTimeout(() => {
      if (this.error) {
        this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>);
      } else {
        this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  simulateSuccess(content: string) {
    this.result = content;
    this.error = null;
  }

  simulateError() {
    this.result = null;
    this.error = new Error('File read error');
  }
}

// Replace global FileReader with our mock
const mockFileReader = MockFileReader;
vi.stubGlobal('FileReader', mockFileReader);

describe('validateJsonFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockFile = (name: string, type: string, content?: string): File => {
    const file = new File([content || ''], name, { type });
    return file;
  };

  it('should validate a valid JSON file successfully', async () => {
    const validJson = '{"name": "test", "value": 123}';
    const file = createMockFile('test.json', 'application/json', validJson);

    // Mock FileReader to return valid JSON
    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(validJson);
      return reader;
    }) as unknown as typeof FileReader;

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: validJson,
      isValid: true,
      error: null,
    });

    global.FileReader = originalFileReader;
  });

  it('should reject invalid JSON content', async () => {
    const invalidJson = '{"name": "test", "value": 123'; // Missing closing brace
    const file = createMockFile('test.json', 'application/json', invalidJson);

    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(invalidJson);
      return reader;
    }) as unknown as typeof FileReader;

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: invalidJson,
      isValid: false,
      error: 'Invalid JSON format. Please check your file and try again.',
    });

    global.FileReader = originalFileReader;
  });

  it('should reject files with wrong extension', async () => {
    const file = createMockFile('test.txt', 'text/plain');

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: '',
      isValid: false,
      error: 'Please upload a valid JSON file',
    });
  });

  it('should reject files with wrong MIME type', async () => {
    const file = createMockFile('test.xml', 'application/xml');

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: '',
      isValid: false,
      error: 'Please upload a valid JSON file',
    });
  });

  it('should accept files with .json extension regardless of MIME type', async () => {
    const validJson = '{"test": true}';
    const file = createMockFile('test.json', 'text/plain', validJson);

    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(validJson);
      return reader;
    }) as unknown as typeof FileReader;

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: validJson,
      isValid: true,
      error: null,
    });

    global.FileReader = originalFileReader;
  });

  it('should accept files with application/json MIME type regardless of extension', async () => {
    const validJson = '{"test": true}';
    const file = createMockFile('test.txt', 'application/json', validJson);

    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(validJson);
      return reader;
    }) as unknown as typeof FileReader;

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: validJson,
      isValid: true,
      error: null,
    });

    global.FileReader = originalFileReader;
  });

  it('should handle FileReader errors', async () => {
    const file = createMockFile('test.json', 'application/json');

    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateError();
      return reader;
    }) as unknown as typeof FileReader;

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: '',
      isValid: false,
      error: 'Failed to read the file. Please try again.',
    });

    global.FileReader = originalFileReader;
  });

  it('should handle empty JSON content', async () => {
    const emptyJson = '';
    const file = createMockFile('test.json', 'application/json', emptyJson);

    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(emptyJson);
      return reader;
    }) as unknown as typeof FileReader;

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: emptyJson,
      isValid: false,
      error: 'Invalid JSON format. Please check your file and try again.',
    });

    global.FileReader = originalFileReader;
  });

  it('should handle valid empty JSON object', async () => {
    const validEmptyJson = '{}';
    const file = createMockFile('test.json', 'application/json', validEmptyJson);

    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(validEmptyJson);
      return reader;
    }) as unknown as typeof FileReader;

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: validEmptyJson,
      isValid: true,
      error: null,
    });

    global.FileReader = originalFileReader;
  });

  it('should handle complex valid JSON', async () => {
    const complexJson = JSON.stringify({
      users: [
        { id: 1, name: 'John', active: true },
        { id: 2, name: 'Jane', active: false }
      ],
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString()
      }
    });
    const file = createMockFile('complex.json', 'application/json', complexJson);

    const originalFileReader = global.FileReader;
    global.FileReader = vi.fn().mockImplementation(() => {
      const reader = new MockFileReader();
      reader.simulateSuccess(complexJson);
      return reader;
    }) as unknown as typeof FileReader;

    const result = await validateJsonFile(file);

    expect(result).toEqual({
      content: complexJson,
      isValid: true,
      error: null,
    });

    global.FileReader = originalFileReader;
  });
});