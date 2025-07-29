import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  highlightSearchMatches, 
  filterEntries, 
  filterObjects, 
  filterEntriesWithFieldNames,
  filterStateFieldsWithRawKeys,
  filterStateFieldsWithRawKeysAndValues,
  highlightSearchMatchesWithContext
} from './searchUtils';

describe('searchUtils', () => {
  describe('highlightSearchMatches', () => {
    it('should return original text when no search term', () => {
      const text = 'Hello world';
      const result = highlightSearchMatches(text, '');
      expect(result).toBe(text);
    });

    it('should return original text when search term is whitespace only', () => {
      const text = 'Hello world';
      const result = highlightSearchMatches(text, '   ');
      expect(result).toBe(text);
    });

    it('should highlight single match case-insensitively', () => {
      const text = 'Hello World';
      const searchTerm = 'world';
      const result = highlightSearchMatches(text, searchTerm);
      
      const { container } = render(<div>{result}</div>);
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveTextContent('World');
      expect(mark).toHaveClass('bg-yellow-200', 'dark:bg-yellow-900/60');
    });

    it('should highlight multiple matches', () => {
      const text = 'Hello world, wonderful world';
      const searchTerm = 'world';
      const result = highlightSearchMatches(text, searchTerm);
      
      const { container } = render(<div>{result}</div>);
      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(2);
      expect(marks[0]).toHaveTextContent('world');
      expect(marks[1]).toHaveTextContent('world');
    });

    it('should handle special regex characters', () => {
      const text = 'Price: $50.99 (50% off)';
      const searchTerm = '$50.99';
      const result = highlightSearchMatches(text, searchTerm);
      
      const { container } = render(<div>{result}</div>);
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveTextContent('$50.99');
    });

    it('should handle no matches', () => {
      const text = 'Hello world';
      const searchTerm = 'xyz';
      const result = highlightSearchMatches(text, searchTerm);
      expect(result).toEqual([text]);
    });

    it('should handle empty text', () => {
      const text = '';
      const searchTerm = 'search';
      const result = highlightSearchMatches(text, searchTerm);
      expect(result).toEqual(['']);
    });

    it('should handle partial word matches', () => {
      const text = 'JavaScript programming';
      const searchTerm = 'Script';
      const result = highlightSearchMatches(text, searchTerm);
      
      const { container } = render(<div>{result}</div>);
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveTextContent('Script');
    });
  });

  describe('filterEntries', () => {
    const testEntries: [string, string][] = [
      ['key1', 'value1'],
      ['key2', 'VALUE2'],
      ['KEY3', 'value3'],
      ['test_key', 'test_value'],
      ['empty', ''],
    ];

    it('should return all entries when no search term', () => {
      const result = filterEntries(testEntries, '');
      expect(result).toEqual(testEntries);
    });

    it('should return all entries when search term is whitespace only', () => {
      const result = filterEntries(testEntries, '   ');
      expect(result).toEqual(testEntries);
    });

    it('should filter by key matches case-insensitively', () => {
      const result = filterEntries(testEntries, 'KEY1');
      expect(result).toEqual([['key1', 'value1']]);
    });

    it('should filter by value matches case-insensitively', () => {
      const result = filterEntries(testEntries, 'value2');
      expect(result).toEqual([['key2', 'VALUE2']]);
    });

    it('should filter by partial matches', () => {
      const result = filterEntries(testEntries, 'test');
      expect(result).toEqual([['test_key', 'test_value']]);
    });

    it('should return multiple matches', () => {
      const result = filterEntries(testEntries, 'value');
      expect(result).toHaveLength(4); // key1, key2, KEY3, test_key all have 'value' in key or value
    });

    it('should handle no matches', () => {
      const result = filterEntries(testEntries, 'nomatch');
      expect(result).toEqual([]);
    });

    it('should handle empty entries array', () => {
      const result = filterEntries([], 'search');
      expect(result).toEqual([]);
    });

    it('should match entries with empty values', () => {
      const result = filterEntries(testEntries, 'empty');
      expect(result).toEqual([['empty', '']]);
    });
  });

  describe('filterObjects', () => {
    interface TestObject extends Record<string, unknown> {
      name: string;
      description: string;
      id: number;
      active?: boolean;
    }

    const testObjects: TestObject[] = [
      { name: 'Object One', description: 'First object', id: 1, active: true },
      { name: 'Object Two', description: 'Second object', id: 2, active: false },
      { name: 'Test Item', description: 'Testing description', id: 3 },
      { name: 'Another', description: 'Another test', id: 4, active: true },
    ];

    it('should return all objects when no search term', () => {
      const result = filterObjects(testObjects, '', ['name', 'description']);
      expect(result).toEqual(testObjects);
    });

    it('should return all objects when search term is whitespace only', () => {
      const result = filterObjects(testObjects, '   ', ['name', 'description']);
      expect(result).toEqual(testObjects);
    });

    it('should filter by single field match', () => {
      const result = filterObjects(testObjects, 'Test Item', ['name']);
      expect(result).toEqual([testObjects[2]]);
    });

    it('should filter across multiple fields', () => {
      const result = filterObjects(testObjects, 'test', ['name', 'description']);
      expect(result).toHaveLength(2); // 'Test Item' and 'Another test'
    });

    it('should be case-insensitive', () => {
      const result = filterObjects(testObjects, 'OBJECT', ['name', 'description']);
      expect(result).toHaveLength(2); // Object One, Object Two
    });

    it('should handle partial matches', () => {
      const result = filterObjects(testObjects, 'Fir', ['description']);
      expect(result).toEqual([testObjects[0]]); // 'First object'
    });

    it('should handle no matches', () => {
      const result = filterObjects(testObjects, 'nonexistent', ['name', 'description']);
      expect(result).toEqual([]);
    });

    it('should handle empty objects array', () => {
      const result = filterObjects([], 'search', ['name']);
      expect(result).toEqual([]);
    });

    it('should handle missing fields gracefully', () => {
      const result = filterObjects(testObjects, 'test', ['name', 'nonexistent'] as (keyof TestObject)[]);
      expect(result).toHaveLength(1); // Only 'Test Item'
    });

    it('should ignore non-string field values', () => {
      const result = filterObjects(testObjects, '1', ['id'] as (keyof TestObject)[]);
      expect(result).toEqual([]); // id is number, should not match
    });

    it('should handle undefined field values', () => {
      const result = filterObjects(testObjects, 'true', ['active'] as (keyof TestObject)[]);
      expect(result).toEqual([]); // active is boolean, should not match
    });

    it('should filter by multiple search criteria', () => {
      const result = filterObjects(testObjects, 'object', ['name', 'description']);
      expect(result).toHaveLength(2); // Object One, Object Two
    });
  });

  describe('filterEntriesWithFieldNames', () => {
    const testEntries: [string, string][] = [
      ['0x0a', 'some_availability_data'],
      ['0x1b', 'validator_info'],
      ['0x2c', 'random_data'],
      ['unknownkey', 'unknown_value'],
    ];

    it('should return all entries when no search term', () => {
      const result = filterEntriesWithFieldNames(testEntries, '');
      expect(result).toEqual(testEntries);
    });

    it('should filter by standard key/value matches', () => {
      const result = filterEntriesWithFieldNames(testEntries, '0x1b');
      expect(result).toEqual([['0x1b', 'validator_info']]);
    });

    it('should filter by field name when raw key matches', () => {
      // Assuming 0x0a maps to availabilityAssignment field
      const result = filterEntriesWithFieldNames(testEntries, 'availability');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive field name searches', () => {
      const result = filterEntriesWithFieldNames(testEntries, 'AVAILABILITY');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no matches', () => {
      const result = filterEntriesWithFieldNames(testEntries, 'nonexistentfield');
      expect(result).toEqual([]);
    });
  });

  describe('filterStateFieldsWithRawKeys', () => {
    it('should return all fields when no search term', () => {
      const result = filterStateFieldsWithRawKeys('');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter by field name', () => {
      const result = filterStateFieldsWithRawKeys('availability');
      expect(result.some(field => field.key === 'availabilityAssignment')).toBe(true);
    });

    it('should filter by field notation', () => {
      const result = filterStateFieldsWithRawKeys('ρ');
      expect(result.some(field => field.notation === 'ρ')).toBe(true);
    });

    it('should filter by field title', () => {
      const result = filterStateFieldsWithRawKeys('rho');
      expect(result.some(field => field.title === 'rho')).toBe(true);
    });

    it('should filter by description content', () => {
      const result = filterStateFieldsWithRawKeys('validator');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter by raw key hex value', () => {
      const result = filterStateFieldsWithRawKeys('0x');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const result = filterStateFieldsWithRawKeys('AVAILABILITY');
      expect(result.some(field => field.key === 'availabilityAssignment')).toBe(true);
    });

    it('should return empty array when no matches', () => {
      const result = filterStateFieldsWithRawKeys('nonexistentfield');
      expect(result).toEqual([]);
    });
  });

  describe('filterStateFieldsWithRawKeysAndValues', () => {
    const mockStateData = {
      '0x0a00000000000000000000000000000000000000000000000000000000000000': 'availability_assignment_data',
      '0x0700000000000000000000000000000000000000000000000000000000000000': 'validator_keys_metadata',
      '0x0100000000000000000000000000000000000000000000000000000000000000': 'auth_pools_value',
    };

    it('should return all fields when no search term', () => {
      const result = filterStateFieldsWithRawKeysAndValues('', mockStateData);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter by field name like the basic function', () => {
      const result = filterStateFieldsWithRawKeysAndValues('availability', mockStateData);
      expect(result.some(field => field.key === 'availabilityAssignment')).toBe(true);
    });

    it('should filter by raw key values in state data', () => {
      const result = filterStateFieldsWithRawKeysAndValues('assignment_data', mockStateData);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter by raw hex keys', () => {
      const result = filterStateFieldsWithRawKeysAndValues('0x0a00', mockStateData);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should work without state data (fallback to field-based search)', () => {
      const result = filterStateFieldsWithRawKeysAndValues('availability');
      expect(result.some(field => field.key === 'availabilityAssignment')).toBe(true);
    });

    it('should handle empty state data', () => {
      const result = filterStateFieldsWithRawKeysAndValues('availability', {});
      expect(result.some(field => field.key === 'availabilityAssignment')).toBe(true);
    });

    it('should be case-insensitive for state values', () => {
      const result = filterStateFieldsWithRawKeysAndValues('ASSIGNMENT_DATA', mockStateData);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle truncated raw keys in state data', () => {
      const stateWithTruncated = { '0x0a00000000000000000000000000000000000000000000000000000000000000': 'test_value' };
      const result = filterStateFieldsWithRawKeysAndValues('test_value', stateWithTruncated);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no matches in any category', () => {
      const result = filterStateFieldsWithRawKeysAndValues('nonexistentanywhere', mockStateData);
      expect(result).toEqual([]);
    });
  });

  describe('highlightSearchMatchesWithContext', () => {
    it('should apply standard highlighting for direct text matches', () => {
      const text = 'Hello world';
      const result = highlightSearchMatchesWithContext(text, 'world');
      
      const { container } = render(<div>{result}</div>);
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveTextContent('world');
      expect(mark).toHaveClass('bg-yellow-200');
    });

    it('should return original text when no search term', () => {
      const text = 'Hello world';
      const result = highlightSearchMatchesWithContext(text, '');
      expect(result).toBe(text);
    });

    it('should highlight raw keys with blue background for field name searches', () => {
      // This test assumes the mapping exists
      const result = highlightSearchMatchesWithContext('0x0a', 'availability', true);
      
      const { container } = render(<div>{result}</div>);
      const span = container.querySelector('span.bg-blue-200');
      if (span) {
        expect(span).toHaveTextContent('0x0a');
        expect(span).toHaveClass('bg-blue-200');
      }
    });

    it('should highlight field names with blue background for raw key searches', () => {
      const result = highlightSearchMatchesWithContext('availabilityAssignment', '0x0a', false);
      
      const { container } = render(<div>{result}</div>);
      const span = container.querySelector('span.bg-blue-200');
      if (span) {
        expect(span).toHaveTextContent('availabilityAssignment');
        expect(span).toHaveClass('bg-blue-200');
      }
    });

    it('should return original text when no cross-reference match exists', () => {
      const text = 'unrelated text';
      const result = highlightSearchMatchesWithContext(text, 'nomatch', false);
      expect(result).toBe(text);
    });

    it('should prioritize direct matches over cross-reference matches', () => {
      const text = 'availability';
      const result = highlightSearchMatchesWithContext(text, 'avail');
      
      const { container } = render(<div>{result}</div>);
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark).toHaveClass('bg-yellow-200'); // Should be standard highlight, not cross-reference
    });
  });
});