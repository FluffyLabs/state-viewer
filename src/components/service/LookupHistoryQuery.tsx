import { useMemo, useState } from 'react';
import { Button, cn } from '@fluffylabs/shared-ui';
import * as hash from '@typeberry/lib/hash';

import { discoverServiceEntries, getLookupHistoryValue, parsePreimageInput } from './serviceUtils';
import ValueDisplay from './ValueDisplay';
import CompositeDiff from '../viewer/CompositeDiff';
import { Service } from '@/types/service';
import { serviceLookupHistory } from '@/constants/serviceFields';
import { RawState } from '@/types/shared';

export interface LookupHistoryQueryProps {
  preState?: RawState;
  state: RawState;
  serviceId: number;
  preService?: Service;
  service: Service;
  disabled?: boolean;
  isDiffMode?: boolean;
}

const libBlake2b = await hash.Blake2b.createHasher();

const LookupHistoryQuery = ({ serviceId, preService, service, state, preState, isDiffMode = false, disabled = false }: LookupHistoryQueryProps) => {
  const [hashInput, setHashInput] = useState('');
  const [length, setLength] = useState('');

  const discoveredKeys = useMemo(() => {
    const post = discoverServiceEntries(state, serviceId);
    const pre = preState ? discoverServiceEntries(preState, serviceId) : [];

    const all = [...post, ...pre].filter(v => v.kind === 'lookup').map(v => v.key);
    return Array.from(new Set(all));
  }, [state, preState, serviceId]);

  const handleQuery = () => {
    if (hashInput && length && service) {
      const result = getLookupHistoryValue(service, hashInput, length, state);
      console.log(`LookupHistory[${serviceId}][${hashInput}][${length}]:`, result);
    }
  };

  const rawKey = useMemo(() => {
    try {
      const result = parsePreimageInput(hashInput);
      if (result.type === 'raw') {
        return result.key.toString();
      }

      return serviceLookupHistory(
        libBlake2b,
        service.serviceId as never,
        result.hash.asOpaque(),
        length as never,
      ).key.toString().substring(0, 64);
    } catch {
      return null;
    }
  }, [service.serviceId, hashInput, length]);

  const preRawValue = rawKey && preState ? preState[rawKey] : undefined;
  const postRawValue = rawKey ? state[rawKey] : undefined;
  const hasChanged = isDiffMode && preRawValue !== postRawValue;

  const renderQueryInput = () => (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Preimage hash for lookup (0x-prefixed)"
        value={hashInput}
        onChange={(e) => setHashInput(e.target.value)}
        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-background dark:text-gray-100 rounded text-sm"
      />
      <input
        type="number"
        placeholder="Length"
        value={length}
        onChange={(e) => setLength(e.target.value)}
        className="sm:w-20 w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-background dark:text-gray-100 rounded text-sm"
      />
      <Button
        size="sm"
        onClick={handleQuery}
        disabled={!hashInput || !length || disabled}
      >
        Query
      </Button>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4">
      {hashInput && length && !disabled && (
        <div className="space-y-2 overflow-hidden">
          <div className="text-xs font-mono">Serialized key: {rawKey}</div>
          {isDiffMode && hasChanged ? (
            <CompositeDiff
              beforeValue={preState && preService ? getLookupHistoryValue(preService, hashInput, length, preState) : undefined}
              afterValue={getLookupHistoryValue(service, hashInput, length, state)}
              beforeRawValue={preRawValue}
              afterRawValue={postRawValue}
            />
          ) : (
            <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
              <ValueDisplay
                value={getLookupHistoryValue(service, hashInput, length, state)}
                rawValue={postRawValue || preRawValue}
                showModeToggle={true}
              />
            </div>
          )}
        </div>
      )}

      {discoveredKeys.length > 0 && (
        <div className="space-y-3 overflow-hidden text-gray-600 dark:text-gray-300">
          <div className="text-xs">{isDiffMode ? 'Changed' : 'Discovered'} items</div>
          <div className="space-y-2">
            {discoveredKeys.map((keyHex) => {
              const preRawValueItem = preState ? preState[keyHex] : undefined;
              const postRawValueItem = state[keyHex];
              const itemChanged = isDiffMode && preRawValueItem !== postRawValueItem;
              return (itemChanged || !isDiffMode) && (
                <div key={keyHex} className={cn("border border-gray-200 dark:border-gray-700 rounded p-2", itemChanged ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700" : "")}>
                  <div className="text-xs font-mono mb-1 break-all">Key: <strong>{keyHex}</strong> {isDiffMode && !itemChanged && "(no change)"}</div>
                  {isDiffMode && itemChanged ? (
                    <CompositeDiff
                      beforeValue={preRawValueItem}
                      afterValue={postRawValueItem}
                      beforeRawValue={preRawValueItem}
                      afterRawValue={postRawValueItem}
                      showBytesLength
                    />
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
