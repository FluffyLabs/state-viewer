
import type { ServiceIdsInputProps } from './types';

const ServiceIdsInput = ({ value, onChange }: ServiceIdsInputProps) => {
  return (
    <div>
      <div className="mb-4">
        <label htmlFor="service-ids-input" className="block text-sm font-medium text-gray-700 mb-2">
          Service IDs (comma-separated):
        </label>
        <input
          id="service-ids-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0, 1, 2"
        />
      </div>
    </div>
  );
};

export default ServiceIdsInput;
