import { useState } from 'react';
import { CompositeViewer } from '../viewer';
import { Button } from '../ui';
import { getLookupHistoryValue } from './serviceUtils';
import type { LookupHistoryQueryProps } from './types';

const LookupHistoryQuery = ({ serviceId, service, disabled = false }: LookupHistoryQueryProps) => {
  const [hash, setHash] = useState('');
  const [length, setLength] = useState('');

  const handleQuery = () => {
    if (hash && length && service) {
      const result = getLookupHistoryValue(service, hash, length);
      console.log(`LookupHistory[${serviceId}][${hash}][${length}]:`, result);
    }
  };

  return (
    <div>
      <h6 className="font-medium text-sm mb-2">Lookup History Query</h6>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Preimage hash for lookup (hex or string)"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <input
          type="number"
          placeholder="Length"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
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
        <div className="bg-gray-100 p-2 rounded text-xs">
          <CompositeViewer
            value={getLookupHistoryValue(service, hash, length)}
            showModeToggle={true}
          />
        </div>
      )}
    </div>
  );
};

export default LookupHistoryQuery;