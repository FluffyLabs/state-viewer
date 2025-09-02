import { useMemo, useState } from 'react';

import { getPreimageValue, parsePreimageInput, discoverPreimageKeysForService } from './serviceUtils';
import PreimageHashDisplay from './PreimageHashDisplay';
import PreimageDiffSection from './PreimageDiffSection';
import { Service } from '@/types/service';
import { RawState } from './types';
import { servicePreimages } from '@/constants/serviceFields';
import { Button, cn } from '@fluffylabs/shared-ui';

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

  const renderQueryInput = () => (
    <div className="flex gap-2">
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
  );

  const renderResults = () => (
    <div className="space-y-4">
      {preimageHash && !disabled && (
        <div className="space-y-2 overflow-hidden">
          <div className="text-xs font-mono mb-1">Serialized key: {rawKey}</div>
          <div className="text-xs font-medium mb-1">Length: {len} bytes</div>
          {isDiffMode && hasChanged ? (
            <div className="space-y-2">
              <PreimageDiffSection
                title="Before:"
                value={preimagePreValue}
                rawValue={preRawValue}
                variant="before"
              />
              <PreimageDiffSection
                title="After:"
                value={preimageValue}
                rawValue={postRawValue}
                variant="after"
              />
            </div>
          ) : (
            <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
              <PreimageHashDisplay
                value={preimageValue}
                rawValue={postRawValue || preRawValue}
                variant="normal"
              />
            </div>
          )}
        </div>
      )}

      {discoveredKeys.length > 0 && (
        <div className="space-y-3 overflow-hidden">
          <div className="text-xs text-gray-600 dark:text-gray-300">Discovered items</div>
          <div className="space-y-2 text-gray-600 dark:text-gray-300">
            {discoveredKeys.map((keyHex) => {
              const preRawValueItem = preState ? preState[keyHex] : undefined;
              const postRawValueItem = state[keyHex];
              const itemChanged = isDiffMode && preRawValueItem !== postRawValueItem;
              return (itemChanged || !isDiffMode) && (
                  <div key={keyHex} className={cn("border border-gray-200 dark:border-gray-700 rounded p-2", itemChanged ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700" : "")}>
                  <div className="text-xs font-mono mb-1 break-all">Key: <strong>{keyHex}</strong> {isDiffMode && !itemChanged && "(no change)"}</div>
                  {isDiffMode && itemChanged ? (
                    <div className="space-y-2">
                      <PreimageDiffSection
                        title="Before:"
                        value={getPreimageValue(preService ?? service, keyHex, preState ?? state)}
                        rawValue={preRawValueItem}
                        variant="before"
                      />
                      <PreimageDiffSection
                        title="After:"
                        value={getPreimageValue(service, keyHex, state)}
                        rawValue={postRawValueItem}
                        variant="after"
                      />
                    </div>
                  ) : !isDiffMode && (
                    <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
                      <PreimageHashDisplay
                        value={getPreimageValue(service, keyHex, state)}
                        rawValue={postRawValueItem || preRawValueItem}
                        variant="normal"
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

export default PreimageQuery;
