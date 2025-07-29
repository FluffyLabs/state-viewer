import { useMemo, useState } from 'react';
import { CompositeViewer } from '../viewer';
import { Button } from '../ui';
import { getLookupHistoryValue, parsePreimageHash } from './serviceUtils';
import { Service } from '@/types/service';
import { RawState } from './types';
import { serviceLookupHistory } from '@/constants/serviceFields';

export interface LookupHistoryQueryProps {
  preState?: RawState;
  state: RawState;
  serviceId: number;
  service: Service;
  disabled?: boolean;
}

const LookupHistoryQuery = ({ serviceId, service, state, disabled = false }: LookupHistoryQueryProps) => {
  const [hash, setHash] = useState('');
  const [length, setLength] = useState('');

  const handleQuery = () => {
    if (hash && length && service) {
      const result = getLookupHistoryValue(service, hash, length);
      console.log(`LookupHistory[${serviceId}][${hash}][${length}]:`, result);
    }
  };

  const rawKey = useMemo(() => {
    try {
      return serviceLookupHistory(
        service.serviceId as never,
        parsePreimageHash(hash).asOpaque(),
        length as never,
      ).key.toString().substring(0, 64);
    } catch {
      return null;
    }
  }, [service.serviceId, hash, length]);

  return (
    <div>
      <h6 className="font-medium text-sm mb-2">Lookup History</h6>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Preimage hash for lookup (0x-prefixed)"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 dark-bg-background dark:text-gray-100 rounded text-sm"
        />
        <input
          type="number"
          placeholder="Length"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 dark-bg-background dark:text-gray-100 rounded text-sm"
        />
        <Button
          size="sm"
          onClick={handleQuery}
          disabled={!hash || !length || disabled}
        >
          Query
        </Button>
      </div>
      {hash && length && !disabled && (
        <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
          <div className="text-xs font-mono">Serialized key: {rawKey}</div>
          <CompositeViewer
            value={getLookupHistoryValue(service, hash, length)}
            rawValue={state[rawKey]}
            showModeToggle={true}
          />
        </div>
      )}
    </div>
  );
};

export default LookupHistoryQuery;
