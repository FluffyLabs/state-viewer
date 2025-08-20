import { useMemo, useState } from 'react';
import { CompositeViewer } from '../viewer';
import { Button } from '../ui';
import { getPreimageValue, parsePreimageInput, discoverPreimageKeysForService } from './serviceUtils';
import { Service } from '@/types/service';
import { RawState } from './types';
import { servicePreimages } from '@/constants/serviceFields';

export interface PreimageQueryProps {
  preState?: RawState;
  state: RawState;
  serviceId: number;
  service: Service;
  preService?: Service;
  disabled?: boolean;
  isDiffMode?: boolean;
}

const PreimageQuery = ({ serviceId, preService, service, state, preState, isDiffMode = false, disabled = false }: PreimageQueryProps) => {
  const [preimageHash, setPreimageHash] = useState('');
  const discoveredKeys = useMemo(() => {
    const post = discoverPreimageKeysForService(state, service.serviceId);
    const pre = preState ? discoverPreimageKeysForService(preState, service.serviceId) : [];
    return Array.from(new Set([...(post || []), ...(pre || [])]));
  }, [state, preState, service.serviceId]);


  const rawKey = useMemo(() => {
    try {
      const input = parsePreimageInput(preimageHash);
      if (input.type === 'raw') {
        return input.key.toString();
      }
      return servicePreimages(
        service.serviceId as never,
        input.hash.asOpaque(),
      ).key.toString().substring(0, 64);
    } catch {
      return null;
    }
  }, [service.serviceId, preimageHash]);

  const handleQuery = () => {
    if (preimageHash && service) {
      const result = getPreimageValue(service, preimageHash, state);
      console.log(`Preimage[${serviceId}][${preimageHash}] value:`, result);
    }
  };

  const preimageValue = useMemo(() => {
    return getPreimageValue(service, preimageHash, state);
  }, [service, preimageHash, state]);

  const preimagePreValue = useMemo(() => {
    if (!preState || !preService) {
      return undefined;
    }
    return getPreimageValue(preService, preimageHash, preState);
  }, [preService, preimageHash, preState]);

  const len = preimageValue?.length;

  const preRawValue = rawKey && preState ? preState[rawKey] : undefined;
  const postRawValue = rawKey ? state[rawKey] : undefined;
  const hasChanged = isDiffMode && preRawValue !== postRawValue;

  return (
    <div>
      <h6 className="font-medium text-sm mb-2">Preimages</h6>
      <div className="flex gap-2 mb-2">
      {discoveredKeys.length > 0 && (
        <div className="space-y-3 mb-3 overflow-hidden">
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
                      {preRawValueItem && (
                        <div>
                          <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Before:</div>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-2 rounded text-xs">
                            <CompositeViewer
                              value={getPreimageValue(preService ?? service, keyHex, preState ?? state)}
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
                              value={getPreimageValue(service, keyHex, state)}
                              rawValue={postRawValueItem}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
                      <CompositeViewer
                        value={getPreimageValue(service, keyHex, state)}
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
          placeholder="Preimage hash (0x-prefixed)"
          value={preimageHash}
          onChange={(e) => setPreimageHash(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 dark-bg-background dark:text-gray-100 rounded text-sm"
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
        <div className="space-y-2 overflow-hidden">
          <div className="text-xs font-mono mb-1">Serialized key: {rawKey}</div>
          <div className="font-medium mb-1">Value ({len} bytes)</div>
          {isDiffMode && hasChanged ? (
            <div className="space-y-2">
              {preRawValue && (
                <div>
                  <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Before:</div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-2 rounded text-xs">
                    <CompositeViewer
                      value={preimagePreValue}
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
                      value={preimageValue}
                      rawValue={postRawValue}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
              <CompositeViewer
                value={preimageValue}
                rawValue={postRawValue || preRawValue}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreimageQuery;
