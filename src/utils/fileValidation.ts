/**
 * File validation orchestrator
 * Routes file validation between binary and JSON handlers
 */

import { validateJsonContent, type JsonValidationResult } from './jsonValidation';
import { convertBinaryToJson } from './binaryConversion';
import {bytes, codec, collections} from '@typeberry/lib';

/**
 * Validates a binary file by converting it to JSON and then validating the JSON
 *
 * @param file - The binary file to validate
 * @returns Promise resolving to JsonValidationResult
 */
const validateBinaryFile = (file: File): Promise<JsonValidationResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        // Convert binary to parsed JSON object
        const parsedJson = convertBinaryToJson(uint8Array);

        // Validate the parsed JSON
        const content = JSON.stringify(parsedJson, replacer, 2);
        const result = validateJsonContent(content);

        resolve(result);
      } catch (error) {
        resolve({
          content: '',
          isValid: false,
          error: `Failed to process binary file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          format: 'unknown',
          formatDescription: 'Binary processing error',
          availableStates: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        content: '',
        isValid: false,
        error: 'Failed to read the binary file. Please try again.',
        format: 'unknown',
        formatDescription: 'File read error',
        availableStates: [],
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validates a JSON file
 *
 * @param file - The JSON file to validate
 * @returns Promise resolving to JsonValidationResult
 */
const validateJsonFile = (file: File): Promise<JsonValidationResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = validateJsonContent(content);
        resolve(result);
      } catch {
        resolve({
          content: e.target?.result as string || '',
          isValid: false,
          error: 'Invalid JSON format. Please check your content and try again.',
          format: 'unknown',
          formatDescription: 'Malformed JSON',
          availableStates: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        content: '',
        isValid: false,
        error: 'Failed to read the file. Please try again.',
        format: 'unknown',
        formatDescription: 'File read error',
        availableStates: [],
      });
    };

    reader.readAsText(file);
  });
};

/**
 * Main file validation function that routes to appropriate handler
 * This is the entry point for all file uploads
 *
 * @param file - The file to validate (can be .json or .bin)
 * @returns Promise resolving to JsonValidationResult
 */
export const validateFile = (file: File): Promise<JsonValidationResult> => {
  // Route based on file extension
  if (file.name.endsWith('.bin')) {
    return validateBinaryFile(file);
  }

  // Handle JSON files
  if (file.type.includes('json') || file.name.endsWith('.json')) {
    return validateJsonFile(file);
  }

  // Unsupported file type
  return Promise.resolve({
    content: '',
    isValid: false,
    error: 'Please upload a valid JSON or .bin file',
    format: 'unknown',
    formatDescription: 'File type not supported',
    availableStates: [],
  });
};

function replacer(_key: string, value: unknown) {
  if (value instanceof bytes.BytesBlob) {
    return value.toString();
  }

  if (value instanceof collections.HashDictionary) {
    return Object.fromEntries(Array.from(value).map(([key, val]) => [key.toString(), val]));
  }

  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }

  if (value instanceof codec.ObjectView) {
    return value.materialize();
  }

  return value;
}
