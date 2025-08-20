import { useMemo, useState } from 'react';
import { CompositeViewer } from '../viewer';
import { Button } from '../ui';
import { getStorageValue, parseStorageKey, discoverStorageKeysForService } from './serviceUtils';
import { Service } from '@/types/service';
import { RawState } from './types';
import { serviceStorage } from '@/constants/serviceFields';

export interface StorageQueryProps {
  preState?: RawState;
  state: RawState;
  serviceId: number;
  service: Service;
  preService?: Service;
  disabled?: boolean;
  isDiffMode?: boolean;
}

const StorageQuery = ({ serviceId, preService, service, state, preState, isDiffMode = false, disabled = false }: StorageQueryProps) => {
  const [storageKey, setStorageKey] = useState('');
  const discoveredKeys = useMemo(() => {
    const post = discoverStorageKeysForService(state, service.serviceId);
    const pre = preState ? discoverStorageKeysForService(preState, service.serviceId) : [];
    return Array.from(new Set([...(post || []), ...(pre || [])]));
  }, [state, preState, service.serviceId]);


  const rawKey = useMemo(() => {
    try {
      const key = parseStorageKey(storageKey);
      if (key.type === 'storage') {
        return serviceStorage(
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

  return (
    <div>
      <h6 className="font-medium text-sm mb-2">Storage</h6>
      <div className="flex gap-2 mb-2 overflow-hidden">
      {discoveredKeys.length > 0 && (
        <div className="space-y-3 mb-3">
          <div className="text-xs text-gray-600 dark:text-gray-300">Discovered items</div>
          <div className="space-y-2">
            {discoveredKeys.map((keyHex) => {
              const preRawValueItem = preState ? preState[keyHex] : undefined;
              const postRawValueItem = state[keyHex];
              const itemChanged = isDiffMode && preRawValueItem !== postRawValueItem;
              return (
                <div key={keyHex} className="border border-gray-200 dark:border-gray-700 rounded p-2">
                  <div className="text-xs font-mono mb-1 break-all">{keyHex}</div>
                  {isDiffMode && itemChanged ? (
                    <div className="space-y-2">
                      {preRawValueItem && preService && preState && (
                        <div>
                          <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Before:</div>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-2 rounded text-xs">
                            <CompositeViewer
                              value={getStorageValue(preService, keyHex, preState)}
                              rawValue={preRawValueItem}
                            />
                          </div>
                        </div>
                      )}
                      {postRawValueItem && (
                        <div>
                          <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">After:</div>
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-2 rounded text-xs">
                            <CompositeViewer
                              value={getStorageValue(service, keyHex, state)}
                              rawValue={postRawValueItem}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
                      <CompositeViewer
                        value={getStorageValue(service, keyHex, state)}
                        rawValue={postRawValueItem || preRawValueItem}
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
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Storage key (hash or string)"
          value={storageKey}
          onChange={(e) => setStorageKey(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 dark-bg-background dark:text-gray-100 rounded text-sm"
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
        <div className="space-y-2">
          <div className="text-xs font-mono">Serialized key: {rawKey}</div>
          {isDiffMode && hasChanged ? (
            <div className="space-y-2">
              {preRawValue && preService && preState && (
                <div>
                  <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Before:</div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-2 rounded text-xs">
                    <CompositeViewer
                      value={getStorageValue(preService, storageKey, preState)}
                      rawValue={preRawValue}
                    />
                  </div>
                </div>
              )}
              {postRawValue && (
                <div>
                  <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">After:</div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-2 rounded text-xs">
                    <CompositeViewer
                      value={getStorageValue(service, storageKey, state)}
                      rawValue={postRawValue}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
              <CompositeViewer
                value={getStorageValue(service, storageKey, state)}
                rawValue={postRawValue || preRawValue}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StorageQuery;
