export interface JsonValidationResult {
  content: string;
  isValid: boolean;
  error: string | null;
}

export const validateJsonFile = (file: File): Promise<JsonValidationResult> => {
  return new Promise((resolve) => {
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      resolve({
        content: '',
        isValid: false,
        error: 'Please upload a valid JSON file',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        JSON.parse(content); // Validate JSON
        resolve({
          content,
          isValid: true,
          error: null,
        });
      } catch {
        resolve({
          content: e.target?.result as string || '',
          isValid: false,
          error: 'Invalid JSON format. Please check your file and try again.',
        });
      }
    };
    reader.onerror = () => {
      resolve({
        content: '',
        isValid: false,
        error: 'Failed to read the file. Please try again.',
      });
    };
    reader.readAsText(file);
  });
};