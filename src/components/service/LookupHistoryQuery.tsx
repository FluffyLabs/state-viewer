import { useMemo, useState } from 'react';
import { Button } from '../ui';
import { getLookupHistoryValue, parsePreimageInput, discoverLookupHistoryKeysForService } from './serviceUtils';
import ValueDisplay from './ValueDisplay';
import ValueDiffSection from './ValueDiffSection';
import { Service } from '@/types/service';
import { RawState } from './types';
import { serviceLookupHistory } from '@/constants/serviceFields';
import { cn } from '@fluffylabs/shared-ui';

export interface LookupHistoryQueryProps {
  preState?: RawState;
  state: RawState;
  serviceId: number;
  preService?: Service;
  service: Service;
  disabled?: boolean;
  isDiffMode?: boolean;
}

const LookupHistoryQuery = ({ serviceId, preService, service, state, preState, isDiffMode = false, disabled = false }: LookupHistoryQueryProps) => {
  const [hash, setHash] = useState('');
  const [length, setLength] = useState('');
  const discoveredKeys = useMemo(() => {
    const postLookup = discoverLookupHistoryKeysForService(state, service.serviceId);
    const preLookup = preState ? discoverLookupHistoryKeysForService(preState, service.serviceId) : [];
    return Array.from(new Set([...(postLookup || []), ...(preLookup || [])]));
  }, [state, preState, service.serviceId]);


  const handleQuery = () => {
    if (hash && length && service) {
      const result = getLookupHistoryValue(service, hash, length, state);
      console.log(`LookupHistory[${serviceId}][${hash}][${length}]:`, result);
    }
  };

  const rawKey = useMemo(() => {
    try {
      const result = parsePreimageInput(hash);
      if (result.type === 'raw') {
        return result.key.toString();
      }

      return serviceLookupHistory(
        service.serviceId as never,
        result.hash.asOpaque(),
        length as never,
      ).key.toString().substring(0, 64);
    } catch {
      return null;
    }
  }, [service.serviceId, hash, length]);

  const preRawValue = rawKey && preState ? preState[rawKey] : undefined;
  const postRawValue = rawKey ? state[rawKey] : undefined;
  const hasChanged = isDiffMode && preRawValue !== postRawValue;

  const renderQueryInput = () => (
    <div className="flex gap-2">
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
        className="sm:w-20 w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 dark-bg-background dark:text-gray-100 rounded text-sm"
      />
      <Button
        size="sm"
        onClick={handleQuery}
        disabled={!hash || !length || disabled}
      >
        Query
      </Button>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4">
      {hash && length && !disabled && (
        <div className="space-y-2 overflow-hidden">
          <div className="text-xs font-mono">Serialized key: {rawKey}</div>
          {isDiffMode && hasChanged ? (
            <div className="space-y-2">
              <ValueDiffSection
                title="Before:"
                value={preState && preService ? getLookupHistoryValue(preService, hash, length, preState) : undefined}
                rawValue={preRawValue}
                variant="before"
                showModeToggle={true}
              />
              <ValueDiffSection
                title="After:"
                value={getLookupHistoryValue(service, hash, length, state)}
                rawValue={postRawValue}
                variant="after"
                showModeToggle={true}
              />
            </div>
          ) : (
            <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
              <ValueDisplay
                value={getLookupHistoryValue(service, hash, length, state)}
                rawValue={postRawValue || preRawValue}
                showModeToggle={true}
              />
            </div>
          )}
        </div>
      )}

      {discoveredKeys.length > 0 && (
        <div className="space-y-3 overflow-hidden text-gray-600 dark:text-gray-300">
          <div className="text-xs">Discovered items</div>
          <div className="space-y-2">
            {discoveredKeys.map((keyHex) => {
              const preRawValueItem = preState ? preState[keyHex] : undefined;
              const postRawValueItem = state[keyHex];
              const itemChanged = isDiffMode && preRawValueItem !== postRawValueItem;
              return (itemChanged || !isDiffMode) && (
                <div key={keyHex} className={cn("border border-gray-200 dark:border-gray-700 rounded p-2", itemChanged ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700" : "")}>
                  <div className="text-xs font-mono mb-1 break-all">Key: <strong>{keyHex}</strong> {isDiffMode && !itemChanged && "(no change)"}</div>
                  {isDiffMode && itemChanged ? (
                    <div className="space-y-2">
                      <ValueDiffSection
                        title="Before:"
                        value={preRawValueItem}
                        rawValue={preRawValueItem}
                        variant="before"
                        showBytesLength
                      />
                      <ValueDiffSection
                        title="After:"
                        value={postRawValueItem}
                        rawValue={postRawValueItem}
                        variant="after"
                        showBytesLength
                      />
                    </div>
                  ) : !isDiffMode && (
                    <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs font-mono break-all">
                      <ValueDisplay
                        value={postRawValueItem || preRawValueItem}
                        rawValue={postRawValueItem || preRawValueItem}
                        showBytesLength
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return { renderQueryInput, renderResults };
};

export default LookupHistoryQuery;
