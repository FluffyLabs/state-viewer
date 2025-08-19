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
  isDiffMode?: boolean;
}

const LookupHistoryQuery = ({ serviceId, service, state, preState, isDiffMode = false, disabled = false }: LookupHistoryQueryProps) => {
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

  const preRawValue = rawKey && preState ? preState[rawKey] : undefined;
  const postRawValue = rawKey ? state[rawKey] : undefined;
  const hasChanged = isDiffMode && preRawValue !== postRawValue;

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
        <div className="space-y-2">
          <div className="text-xs font-mono">Serialized key: {rawKey}</div>
          {isDiffMode && hasChanged ? (
            <div className="space-y-2">
              {preRawValue && (
                <div>
                  <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Before:</div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-2 rounded text-xs">
                    <CompositeViewer
                      value={getLookupHistoryValue(service, hash, length)}
                      rawValue={preRawValue}
                      showModeToggle={true}
                    />
                  </div>
                </div>
              )}
              {postRawValue && (
                <div>
                  <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">After:</div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-2 rounded text-xs">
                    <CompositeViewer
                      value={getLookupHistoryValue(service, hash, length)}
                      rawValue={postRawValue}
                      showModeToggle={true}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
              <CompositeViewer
                value={getLookupHistoryValue(service, hash, length)}
                rawValue={postRawValue || preRawValue}
                showModeToggle={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LookupHistoryQuery;
