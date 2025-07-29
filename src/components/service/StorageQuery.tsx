import { useMemo, useState } from 'react';
import { CompositeViewer } from '../viewer';
import { Button } from '../ui';
import { getStorageValue, parseStorageKey } from './serviceUtils';
import { Service } from '@/types/service';
import { RawState } from './types';
import { serviceStorage } from '@/constants/serviceFields';

export interface StorageQueryProps {
  preState?: RawState;
  state: RawState;
  serviceId: number;
  service: Service;
  disabled?: boolean;
}

const StorageQuery = ({ serviceId, service, state, disabled = false }: StorageQueryProps) => {
  const [storageKey, setStorageKey] = useState('');

  const rawKey = useMemo(() => {
    try {
      return serviceStorage(
        service.serviceId as never,
        parseStorageKey(storageKey).asOpaque(),
      ).key.toString().substring(0, 64);
    } catch {
      return null;
    }
  }, [service.serviceId, storageKey]);

  const handleQuery = () => {
    if (storageKey && service) {
      const result = getStorageValue(service, storageKey);
      console.log(`Storage[${serviceId}][${storageKey}]:`, result);
    }
  };

  return (
    <div>
      <h6 className="font-medium text-sm mb-2">Storage</h6>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Storage key (hash or string)"
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
          <span className="text-xs font-mono">Serialized key: {rawKey}</span>
          <CompositeViewer
            value={getStorageValue(service, storageKey)}
            rawValue={state[rawKey]}
          />
        </div>
      )}
    </div>
  );
};

export default StorageQuery;
