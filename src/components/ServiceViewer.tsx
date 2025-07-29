import blake2b from "blake2b";
import { useState, useMemo } from 'react';
import { CompositeViewer } from './viewer';
import { Button } from './ui';
import type { Service, StateAccess, StorageKey, PreimageHash, U32 } from '../types/service';
import { bytes } from '@typeberry/state-merkleization';

interface ServiceViewerProps {
  preStateAccess?: StateAccess | null;
  postStateAccess?: StateAccess | null;
}

// Helper function to ensure serviceId is included in service info
const getServiceInfoWithId = (service: Service | null, serviceId: number) => {
  if (!service) return null;
  const info = service.getInfo();
  return { ...info, serviceId };
};

const ServiceViewer = ({ preStateAccess, postStateAccess }: ServiceViewerProps) => {
  const [serviceIdsInput, setServiceIdsInput] = useState('0');
  const [storageQueries, setStorageQueries] = useState<Record<string, string>>({});
  const [preimageQueries, setPreimageQueries] = useState<Record<string, string>>({});
  const [lookupQueries, setLookupQueries] = useState<Record<string, { hash: string; length: string }>>({});

  const serviceIds = useMemo(() => {
    return serviceIdsInput
      .split(',')
      .map(id => id.trim())
      .filter(id => id !== '')
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));
  }, [serviceIdsInput]);

  const services = useMemo(() => {
    return serviceIds.map(serviceId => {
      let preService: Service | null = null;
      let postService: Service | null = null;
      let preError: string | null = null;
      let postError: string | null = null;

      try {
        preService = preStateAccess?.getService?.(serviceId) || null;
      } catch (err) {
        preError = err instanceof Error ? err.message : 'Unknown error';
      }

      try {
        postService = postStateAccess?.getService?.(serviceId) || null;
      } catch (err) {
        postError = err instanceof Error ? err.message : 'Unknown error';
      }

      return {
        serviceId,
        preService,
        postService,
        preError,
        postError,
      };
    });
  }, [serviceIds, preStateAccess, postStateAccess]);

  const parseStorageKey = (input: string): StorageKey => {
    if (input.startsWith('0x')) {
      if (input.length === 66) {
        return bytes.Bytes.parseBytes(input, 32);
      }
      if (input.length === 64) {
        return bytes.Bytes.parseBytes(input, 31);
      }
    }
    const hasher = blake2b(32);
    hasher.update(bytes.BytesBlob.blobFromString(input).raw);
    return bytes.Bytes.fromBlob(hasher.digest(), 32);
  };

  const parsePreimageHash = (input: string): PreimageHash => {
    return bytes.Bytes.parseBytes(input, 32);
  };

  const getStorageValue = (service: Service, key: string) => {
    try {
      const storageKey = parseStorageKey(key);
      return service.getStorage(storageKey);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  };

  const getPreimageValue = (service: Service, hash: string) => {
    try {
      const preimageHash = parsePreimageHash(hash);
      const hasPreimage = service.hasPreimage(preimageHash);
      if (!hasPreimage) {
        return null;
      }
      return service.getPreimage(preimageHash);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  };

  const getLookupHistoryValue = (service: Service, hash: string, length: string) => {
    try {
      const preimageHash = parsePreimageHash(hash);
      const len = parseInt(length, 10) as U32;
      if (isNaN(len)) {
        return 'Error: Invalid length';
      }
      return service.getLookupHistory(preimageHash, len);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  };

  const isDiffMode = preStateAccess !== undefined;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-md font-medium mb-3">Service Accounts</h4>
        <div className="mb-4">
          <label htmlFor="service-ids-input" className="block text-sm font-medium text-gray-700 mb-2">
            Service IDs (comma-separated):
          </label>
          <input
            id="service-ids-input"
            type="text"
            value={serviceIdsInput}
            onChange={(e) => setServiceIdsInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0, 1, 2"
          />
        </div>
      </div>

      <div className="space-y-4">
        {services.map(({ serviceId, preService, postService, preError, postError }) => {
          const hasService = preService || postService;
          const hasChanged = isDiffMode && (
            (preService === null) !== (postService === null) ||
            (preService && postService && 
              JSON.stringify(getServiceInfoWithId(preService, serviceId)) !== 
              JSON.stringify(getServiceInfoWithId(postService, serviceId)))
          );

          if (isDiffMode && !hasChanged && !hasService) {
            return null;
          }

          return (
            <div key={serviceId} className={`border rounded p-4 ${hasChanged ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <h5 className="font-semibold text-lg">Service {serviceId}</h5>
                {hasChanged && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">CHANGED</span>}
              </div>

              {(preError || postError) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3">
                  {preError && <div>Pre-state error: {preError}</div>}
                  {postError && <div>Post-state error: {postError}</div>}
                </div>
              )}

              {!hasService && !preError && !postError && (
                <div className="text-gray-500 italic">Service not found</div>
              )}

              {/* Service Info */}
              {hasService && (
                <div className="space-y-4">
                  <div>
                    <h6 className="font-medium text-sm mb-2">Service Info</h6>
                    {isDiffMode && hasChanged ? (
                      <div className="space-y-2">
                        {preService && (
                          <div>
                            <div className="text-xs font-medium text-red-700 mb-1">Before:</div>
                            <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                              <CompositeViewer value={getServiceInfoWithId(preService, serviceId)} showModeToggle={true} />
                            </div>
                          </div>
                        )}
                        {postService && (
                          <div>
                            <div className="text-xs font-medium text-green-700 mb-1">After:</div>
                            <div className="bg-green-50 border border-green-200 p-2 rounded text-xs">
                              <CompositeViewer value={getServiceInfoWithId(postService, serviceId)} showModeToggle={true} />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-2 rounded text-xs">
                        <CompositeViewer
                          value={getServiceInfoWithId(postService || preService, serviceId)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Storage Query */}
                  <div>
                    <h6 className="font-medium text-sm mb-2">Storage Query</h6>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Storage key (hex or string)"
                        value={storageQueries[serviceId] || ''}
                        onChange={(e) => setStorageQueries(prev => ({ ...prev, [serviceId]: e.target.value }))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const key = storageQueries[serviceId];
                          if (key && (postService || preService)) {
                            const service = postService || preService!;
                            const result = getStorageValue(service, key);
                            console.log(`Storage[${serviceId}][${key}]:`, result);
                          }
                        }}
                        disabled={!storageQueries[serviceId] || !hasService}
                      >
                        Query
                      </Button>
                    </div>
                    {storageQueries[serviceId] && hasService && (
                      <div className="bg-gray-100 p-2 rounded text-xs">
                        <CompositeViewer
                          value={getStorageValue((postService || preService)!, storageQueries[serviceId])}
                        />
                      </div>
                    )}
                  </div>

                  {/* Preimage Query */}
                  <div>
                    <h6 className="font-medium text-sm mb-2">Preimage Query</h6>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Preimage hash (hex or string)"
                        value={preimageQueries[serviceId] || ''}
                        onChange={(e) => setPreimageQueries(prev => ({ ...prev, [serviceId]: e.target.value }))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const hash = preimageQueries[serviceId];
                          if (hash && (postService || preService)) {
                            const service = postService || preService!;
                            const result = getPreimageValue(service, hash);
                            console.log(`Preimage[${serviceId}][${hash}] value:`, result);
                          }
                        }}
                        disabled={!preimageQueries[serviceId] || !hasService}
                      >
                        Query
                      </Button>
                    </div>
                    {preimageQueries[serviceId] && hasService && (
                      <div className="space-y-2">
                        <div className="bg-gray-100 p-2 rounded text-xs">
                          <div className="font-medium mb-1">Preimage Value:</div>
                          <CompositeViewer
                            value={getPreimageValue((postService || preService)!, preimageQueries[serviceId])}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lookup History Query */}
                  <div>
                    <h6 className="font-medium text-sm mb-2">Lookup History Query</h6>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Preimage hash for lookup (hex or string)"
                        value={lookupQueries[serviceId]?.hash || ''}
                        onChange={(e) => setLookupQueries(prev => ({
                          ...prev,
                          [serviceId]: { ...prev[serviceId], hash: e.target.value }
                        }))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Length"
                        value={lookupQueries[serviceId]?.length || ''}
                        onChange={(e) => setLookupQueries(prev => ({
                          ...prev,
                          [serviceId]: { ...prev[serviceId], length: e.target.value }
                        }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const query = lookupQueries[serviceId];
                          if (query?.hash && query?.length && (postService || preService)) {
                            const service = postService || preService!;
                            const result = getLookupHistoryValue(service, query.hash, query.length);
                            console.log(`LookupHistory[${serviceId}][${query.hash}][${query.length}]:`, result);
                          }
                        }}
                        disabled={!lookupQueries[serviceId]?.hash || !lookupQueries[serviceId]?.length || !hasService}
                      >
                        Query
                      </Button>
                    </div>
                    {lookupQueries[serviceId]?.hash && lookupQueries[serviceId]?.length && hasService && (
                      <div className="bg-gray-100 p-2 rounded text-xs">
                        <CompositeViewer
                          value={getLookupHistoryValue(
                            (postService || preService)!,
                            lookupQueries[serviceId].hash,
                            lookupQueries[serviceId].length
                          )}
                          showModeToggle={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {services.length === 0 && serviceIdsInput.trim() && (
          <div className="text-center py-4 text-gray-500">
            No valid service IDs found in input: "{serviceIdsInput}"
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceViewer;
