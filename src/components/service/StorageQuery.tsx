import { useMemo, useState } from 'react';
import { discoverServiceEntries, getStorageValue, parseStorageKey } from './serviceUtils';
import ValueDisplay from './ValueDisplay';
import CompositeDiff from '../viewer/CompositeDiff';
import { Service } from '@/types/service';
import { serviceStorage } from '@/constants/serviceFields';
import { Button, cn } from '@fluffylabs/shared-ui';
import * as hash from '@typeberry/lib/hash';
import {RawState} from '@/types/shared';

export interface StorageQueryProps {
  preState?: RawState;
  state: RawState;
  serviceId: number;
  service: Service;
  preService?: Service;
  disabled?: boolean;
  isDiffMode?: boolean;
}

const libBlake2b = await hash.Blake2b.createHasher();

const StorageQuery = ({ serviceId, preService, service, state, preState, isDiffMode = false, disabled = false }: StorageQueryProps) => {
  const [storageKey, setStorageKey] = useState('');

  const discoveredKeys = useMemo(() => {
    const post = discoverServiceEntries(state, serviceId);
    const pre = preState ? discoverServiceEntries(preState, serviceId) : [];

    const all = [...post, ...pre].filter(v => v.kind === 'storage-or-lookup').map(v => v.key);
    return Array.from(new Set(all));
  }, [state, preState, serviceId]);

  const rawKey = useMemo(() => {
    try {
      const key = parseStorageKey(storageKey);
      if (key.type === 'storage') {
        return serviceStorage(
          libBlake2b,
          service.serviceId as never,
          key.key.asOpaque(),
        ).key.toString().substring(0, 64);
      }
      return key.key.toString();
    } catch {
      return null;
    }
  }, [service.serviceId, storageKey]);

  const handleQuery = () => {
    if (storageKey && service) {
      const result = getStorageValue(service, storageKey, state);
      console.log(`Storage[${serviceId}][${storageKey}]:`, result);
    }
  };

  const preRawValue = rawKey && preState ? preState[rawKey] : undefined;
  const postRawValue = rawKey ? state[rawKey] : undefined;
  const hasChanged = isDiffMode && preRawValue !== postRawValue;

  const renderQueryInput = () => (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Storage key (hash or string)"
        value={storageKey}
        onChange={(e) => setStorageKey(e.target.value)}
        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-background dark:text-gray-100 rounded text-sm"
      />
      <Button
        size="sm"
        onClick={handleQuery}
        disabled={!storageKey || disabled}
      >
        Query
      </Button>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4">
      {storageKey && !disabled && (
        <div className="space-y-2 overflow-hidden">
          <div className="text-xs font-mono">Serialized key: {rawKey}</div>
          {isDiffMode && hasChanged ? (
            <CompositeDiff
              beforeValue={preState && preService ? getStorageValue(preService, storageKey, preState) : undefined}
              afterValue={getStorageValue(service, storageKey, state)}
              beforeRawValue={preRawValue}
              afterRawValue={postRawValue}
            />
          ) : (
            <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
              <ValueDisplay
                value={getStorageValue(service, storageKey, state)}
                rawValue={postRawValue || preRawValue}
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
                      beforeValue={preState && preService ? getStorageValue(preService, keyHex, preState) : undefined}
                      afterValue={getStorageValue(service, keyHex, state)}
                      beforeRawValue={preRawValueItem}
                      afterRawValue={postRawValueItem}
                      showBytesLength
                    />
                  ) : !isDiffMode && (
                    <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
                      <ValueDisplay
                        value={getStorageValue(service, keyHex, state)}
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

export default StorageQuery;
