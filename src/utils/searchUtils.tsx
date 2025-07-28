import React from 'react';
import { STATE_FIELDS, createRawKeyToFieldMap, createFieldToRawKeyMap } from '@/constants/stateFields';

/**
 * Highlights search matches in text with a yellow background
 */
export const highlightSearchMatches = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = regex.test(part);
    regex.lastIndex = 0; // Reset regex for next test

    return isMatch ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-100 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    );
  });
};

/**
 * Filters entries based on search term matching keys or values
 */
export const filterEntries = <T extends [string, string]>(
  entries: T[],
  searchTerm: string
): T[] => {
  if (!searchTerm.trim()) return entries;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return entries.filter(([key, value]) =>
    key.toLowerCase().includes(lowerSearchTerm) ||
    value.toLowerCase().includes(lowerSearchTerm)
  );
};

/**
 * Filters objects based on search term matching specific properties
 */
export const filterObjects = <T extends Record<string, unknown>>(
  objects: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return objects;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return objects.filter(obj =>
    searchFields.some(field => {
      const value = obj[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearchTerm);
      }
      return false;
    })
  );
};

/**
 * Enhanced filtering for RawStateViewer that considers field names when searching raw keys
 */
export const filterEntriesWithFieldNames = (
  entries: [string, string][],
  searchTerm: string
): [string, string][] => {
  if (!searchTerm.trim()) return entries;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  const fieldToRawKeyMap = createFieldToRawKeyMap();
  
  return entries.filter(([key, value]) => {
    // Standard key/value search
    const standardMatch = key.toLowerCase().includes(lowerSearchTerm) ||
                         value.toLowerCase().includes(lowerSearchTerm);
    
    if (standardMatch) return true;
    
    // Check if search term matches any field names/notations that map to this raw key
    for (const [fieldIdentifier, rawKey] of fieldToRawKeyMap) {
      if (fieldIdentifier.includes(lowerSearchTerm) && 
          (key === rawKey || key === rawKey.substring(0, rawKey.length - 2))) {
        return true;
      }
    }
    
    return false;
  });
};

/**
 * Enhanced filtering for InspectStateViewer that considers raw keys when searching field names
 */
export const filterStateFieldsWithRawKeys = (
  searchTerm: string
): typeof STATE_FIELDS => {
  if (!searchTerm.trim()) return STATE_FIELDS;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  const rawKeyToFieldMap = createRawKeyToFieldMap();
  
  return STATE_FIELDS.filter(field => {
    // Standard field property search
    const standardMatch = field.key.toLowerCase().includes(lowerSearchTerm) ||
                         field.title.toLowerCase().includes(lowerSearchTerm) ||
                         field.description.toLowerCase().includes(lowerSearchTerm) ||
                         field.notation.toLowerCase().includes(lowerSearchTerm);
    
    if (standardMatch) return true;
    
    // Check if search term matches the raw key for this field
    const rawKey = field.serialize?.key?.toString();
    if (rawKey && rawKey.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }
    
    // Check if search term matches any raw key that maps to a field with similar properties
    for (const [rawKey, mappedField] of rawKeyToFieldMap) {
      if (rawKey.toLowerCase().includes(lowerSearchTerm) && 
          mappedField.key === field.key) {
        return true;
      }
    }
    
    return false;
  });
};

/**
 * Enhanced filtering for InspectStateViewer that also searches through actual state values
 */
export const filterStateFieldsWithRawKeysAndValues = (
  searchTerm: string,
  stateData?: Record<string, string>
): typeof STATE_FIELDS => {
  if (!searchTerm.trim()) return STATE_FIELDS;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  const rawKeyToFieldMap = createRawKeyToFieldMap();
  
  return STATE_FIELDS.filter(field => {
    // Standard field property search
    const standardMatch = field.key.toLowerCase().includes(lowerSearchTerm) ||
                         field.title.toLowerCase().includes(lowerSearchTerm) ||
                         field.description.toLowerCase().includes(lowerSearchTerm) ||
                         field.notation.toLowerCase().includes(lowerSearchTerm);
    
    if (standardMatch) return true;
    
    // Check if search term matches the raw key for this field
    const rawKey = field.serialize?.key?.toString();
    if (rawKey && rawKey.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }
    
    // Check if search term matches any raw key that maps to a field with similar properties
    for (const [rawKey, mappedField] of rawKeyToFieldMap) {
      if (rawKey.toLowerCase().includes(lowerSearchTerm) && 
          mappedField.key === field.key) {
        return true;
      }
    }
    
    // Search through actual state values if state data is provided
    if (stateData && rawKey) {
      const rawValue = stateData[rawKey] || stateData[rawKey.substring(0, rawKey.length - 2)];
      if (rawValue && rawValue.toLowerCase().includes(lowerSearchTerm)) {
        return true;
      }
    }
    
    return false;
  });
};

/**
 * Enhanced highlight function that highlights both the original text and related field/raw key matches
 */
export const highlightSearchMatchesWithContext = (
  text: string, 
  searchTerm: string,
  isRawKey: boolean = false
): React.ReactNode => {
  if (!searchTerm.trim()) return text;
  
  // First apply standard highlighting
  const standardHighlight = highlightSearchMatches(text, searchTerm);
  
  // If we already have a direct match, return it
  if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
    return standardHighlight;
  }
  
  // Check for cross-reference matches
  if (isRawKey) {
    // This is a raw key, check if search term matches field names
    const rawKeyToFieldMap = createRawKeyToFieldMap();
    const field = rawKeyToFieldMap.get(text) || rawKeyToFieldMap.get(text.substring(0, text.length - 2));
    
    if (field) {
      const fieldMatches = [field.key, field.title, field.notation].some(
        prop => prop.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (fieldMatches) {
        return (
          <span className="bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 px-0.5 rounded">
            {text}
          </span>
        );
      }
    }
  } else {
    // This might be a field name, check if search term matches raw keys
    const fieldToRawKeyMap = createFieldToRawKeyMap();
    const rawKey = fieldToRawKeyMap.get(text.toLowerCase());
    
    if (rawKey && rawKey.toLowerCase().includes(searchTerm.toLowerCase())) {
      return (
        <span className="bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 px-0.5 rounded">
          {text}
        </span>
      );
    }
  }
  
  return text;
};