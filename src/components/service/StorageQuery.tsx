import { useState } from 'react';
import { CompositeViewer } from '../viewer';
import { Button } from '../ui';
import { getStorageValue } from './serviceUtils';
import type { StorageQueryProps } from './types';

const StorageQuery = ({ serviceId, service, disabled = false }: StorageQueryProps) => {
  const [storageKey, setStorageKey] = useState('');

  const handleQuery = () => {
    if (storageKey && service) {
      const result = getStorageValue(service, storageKey);
      console.log(`Storage[${serviceId}][${storageKey}]:`, result);
    }
  };

  return (
    <div>
      <h6 className="font-medium text-sm mb-2">Storage Query</h6>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Storage key (hex or string)"
          value={storageKey}
          onChange={(e) => setStorageKey(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <Button
          size="sm"
          onClick={handleQuery}
          disabled={!storageKey || disabled}
        >
          Query
        </Button>
      </div>
      {storageKey && !disabled && (
        <div className="bg-gray-100 p-2 rounded text-xs">
          <CompositeViewer
            value={getStorageValue(service, storageKey)}
          />
        </div>
      )}
    </div>
  );
};

export default StorageQuery;