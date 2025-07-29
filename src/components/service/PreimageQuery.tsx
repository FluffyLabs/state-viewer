import { useState } from 'react';
import { CompositeViewer } from '../viewer';
import { Button } from '../ui';
import { getPreimageValue } from './serviceUtils';
import type { PreimageQueryProps } from './types';

const PreimageQuery = ({ serviceId, service, disabled = false }: PreimageQueryProps) => {
  const [preimageHash, setPreimageHash] = useState('');

  const handleQuery = () => {
    if (preimageHash && service) {
      const result = getPreimageValue(service, preimageHash);
      console.log(`Preimage[${serviceId}][${preimageHash}] value:`, result);
    }
  };

  return (
    <div>
      <h6 className="font-medium text-sm mb-2">Preimage Query</h6>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Preimage hash (hex or string)"
          value={preimageHash}
          onChange={(e) => setPreimageHash(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <Button
          size="sm"
          onClick={handleQuery}
          disabled={!preimageHash || disabled}
        >
          Query
        </Button>
      </div>
      {preimageHash && !disabled && (
        <div className="space-y-2">
          <div className="bg-gray-100 p-2 rounded text-xs">
            <div className="font-medium mb-1">Preimage Value:</div>
            <CompositeViewer
              value={getPreimageValue(service, preimageHash)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PreimageQuery;