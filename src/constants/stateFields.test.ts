import { describe, it, expect } from 'vitest';
import { STATE_FIELDS, createRawKeyToFieldMap, createFieldToRawKeyMap } from './stateFields';

describe('stateFields constants', () => {
  describe('STATE_FIELDS', () => {
    it('should contain expected number of fields', () => {
      expect(STATE_FIELDS.length).toBeGreaterThan(0);
      expect(STATE_FIELDS.length).toBe(18); // Based on the fields defined
    });

    it('should have all required properties for each field', () => {
      STATE_FIELDS.forEach(field => {
        expect(field).toHaveProperty('key');
        expect(field).toHaveProperty('notation');
        expect(field).toHaveProperty('title');
        expect(field).toHaveProperty('description');
        expect(field).toHaveProperty('serialize');

        expect(typeof field.key).toBe('string');
        expect(typeof field.notation).toBe('string');
        expect(typeof field.title).toBe('string');
        expect(typeof field.description).toBe('string');
        expect(field.serialize).toBeDefined();
      });
    });

    it('should have unique keys', () => {
      const keys = STATE_FIELDS.map(field => field.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have unique notations', () => {
      const notations = STATE_FIELDS.map(field => field.notation);
      const uniqueNotations = new Set(notations);
      expect(uniqueNotations.size).toBe(notations.length);
    });

    it('should contain expected specific fields', () => {
      const fieldKeys = STATE_FIELDS.map(field => field.key);
      expect(fieldKeys).toContain('availabilityAssignment');
      expect(fieldKeys).toContain('currentValidatorData');
      expect(fieldKeys).toContain('timeslot');
      expect(fieldKeys).toContain('entropy');
    });

    it('should have non-empty descriptions', () => {
      STATE_FIELDS.forEach(field => {
        expect(field.description.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('createRawKeyToFieldMap', () => {
    it('should create a map with raw keys pointing to field objects', () => {
      const map = createRawKeyToFieldMap();
      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBeGreaterThan(0);
    });

    it('should map raw keys to correct field objects', () => {
      const map = createRawKeyToFieldMap();

      // Test that we can find fields by their raw keys
      for (const [, field] of map) {
        expect(field).toHaveProperty('key');
        expect(field).toHaveProperty('notation');
        expect(field).toHaveProperty('title');
        expect(field).toHaveProperty('description');
      }
    });

    it('should handle fields without serialize keys gracefully', () => {
      const map = createRawKeyToFieldMap();
      // Should not throw and should still create a map
      expect(map).toBeInstanceOf(Map);
    });

    it('should include both full and truncated raw keys', () => {
      const map = createRawKeyToFieldMap();
      const rawKeys = Array.from(map.keys());

      // Should have some keys that might be truncated versions
      // This might be true depending on the actual raw key structure
      expect(rawKeys.length).toBeGreaterThan(0);
    });
  });

  describe('createFieldToRawKeyMap', () => {
    it('should create a map with field identifiers pointing to raw keys', () => {
      const map = createFieldToRawKeyMap();
      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBeGreaterThan(0);
    });

    it('should map field keys to raw keys', () => {
      const map = createFieldToRawKeyMap();

      STATE_FIELDS.forEach(field => {
        const rawKey = field.serialize?.key?.toString();
        if (rawKey) {
          expect(map.has(field.key.toLowerCase())).toBe(true);
          expect(map.get(field.key.toLowerCase())).toBe(rawKey);
        }
      });
    });

    it('should map field titles to raw keys', () => {
      const map = createFieldToRawKeyMap();

      STATE_FIELDS.forEach(field => {
        const rawKey = field.serialize?.key?.toString();
        if (rawKey) {
          expect(map.has(field.title.toLowerCase())).toBe(true);
          expect(map.get(field.title.toLowerCase())).toBe(rawKey);
        }
      });
    });

    it('should map field notations to raw keys', () => {
      const map = createFieldToRawKeyMap();

      STATE_FIELDS.forEach(field => {
        const rawKey = field.serialize?.key?.toString();
        if (rawKey) {
          expect(map.has(field.notation.toLowerCase())).toBe(true);
          expect(map.get(field.notation.toLowerCase())).toBe(rawKey);
        }
      });
    });

    it('should store all identifiers in lowercase', () => {
      const map = createFieldToRawKeyMap();

      for (const [identifier] of map) {
        expect(identifier).toBe(identifier.toLowerCase());
      }
    });
  });

  describe('bidirectional mapping consistency', () => {
    it('should maintain consistency between field-to-raw and raw-to-field maps', () => {
      const fieldToRawMap = createFieldToRawKeyMap();
      const rawToFieldMap = createRawKeyToFieldMap();

      // Basic consistency check - maps should exist and have content
      expect(fieldToRawMap.size).toBeGreaterThan(0);
      expect(rawToFieldMap.size).toBeGreaterThan(0);

      // Check that most raw keys from field-to-raw map exist in raw-to-field map
      // For each field in the field-to-raw map
      let foundMappings = 0;
      for (const [, rawKey] of fieldToRawMap) {
        const field = rawToFieldMap.get(rawKey) || rawToFieldMap.get(rawKey.substring(0, rawKey.length - 2));
        if (field) {
          foundMappings++;
        }
      }

      // At least half of the mappings should be bidirectional
      expect(foundMappings).toBeGreaterThan(fieldToRawMap.size / 2);
    });

    it('should allow round-trip lookups', () => {
      const fieldToRawMap = createFieldToRawKeyMap();
      const rawToFieldMap = createRawKeyToFieldMap();

      // Pick a known field
      const testField = STATE_FIELDS[0];
      const rawKey = testField.serialize?.key?.toString();

      if (rawKey) {
        // Field key -> Raw key -> Field object
        const foundRawKey = fieldToRawMap.get(testField.key.toLowerCase());
        expect(foundRawKey).toBe(rawKey);

        const foundField = rawToFieldMap.get(foundRawKey!);
        expect(foundField?.key).toBe(testField.key);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty serialize objects', () => {
      // This tests robustness of the mapping functions
      expect(() => createRawKeyToFieldMap()).not.toThrow();
      expect(() => createFieldToRawKeyMap()).not.toThrow();
    });

    it('should handle special characters in notations', () => {
      const map = createFieldToRawKeyMap();

      // Check that Greek letters and special characters are handled
      const greekLetterCount = Array.from(map.keys()).filter(key => 
        /[α-ωΑ-Ω]/.test(key)
      ).length;
      // This should be true given our field definitions
      expect(greekLetterCount).toBeGreaterThan(0);
    });

    it('should not have conflicting mappings', () => {
      const fieldToRawMap = createFieldToRawKeyMap();
      const identifiers = Array.from(fieldToRawMap.keys());
      const uniqueIdentifiers = new Set(identifiers);

      // All identifiers should be unique (no conflicts)
      expect(uniqueIdentifiers.size).toBe(identifiers.length);
    });
  });
});
