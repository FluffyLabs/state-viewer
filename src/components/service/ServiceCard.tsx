
import { useMemo, useState } from 'react';
import ServiceError from './ServiceError';
import ServiceInfo from './ServiceInfo';
import StorageQuery from './StorageQuery';
import PreimageQuery from './PreimageQuery';
import LookupHistoryQuery from './LookupHistoryQuery';
import { getServiceChangeType, discoverStorageKeysForService, discoverPreimageKeysForService, discoverLookupHistoryKeysForService, getComprehensiveServiceChangeType } from './serviceUtils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui';
import type { RawState, ServiceData } from './types';

export interface ServiceCardProps {
  preState?: RawState;
  state: RawState;
  serviceData: ServiceData;
  isDiffMode: boolean;
}

const ServiceCard = ({ serviceData, isDiffMode, preState, state }: ServiceCardProps) => {
  const [activeTab, setActiveTab] = useState('storage');
  const { serviceId, preService, postService, preError, postError } = serviceData;
  const activeService = postService || preService;

  const changeType = isDiffMode ? getServiceChangeType(serviceData) : 'normal';
  const changeInfo = isDiffMode ? getComprehensiveServiceChangeType(serviceData, state, preState) : null;
  
  const backgroundClass = isDiffMode ? {
    'added': 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700',
    'removed': 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700',
    'changed': 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
    'normal': 'bg-gray-50 dark:bg-gray-900/20'
  }[changeType] : 'bg-gray-50 dark:bg-gray-900/20';
  const counts = useMemo(() => {
    const calc = (discoverFn: (s: Record<string, string>, id: number) => string[]) => {
      const post = discoverFn(state, serviceId);
      const pre = preState ? discoverFn(preState, serviceId) : [];
      const preSet = new Set(pre);
      const postSet = new Set(post);
      const total = Array.from(new Set([...pre, ...post]));
      const added = post.filter((k) => !preSet.has(k));
      const removed = pre.filter((k) => !postSet.has(k));
      const changed = total.filter((k) => preSet.has(k) && postSet.has(k) && preState && preState[k] !== state[k]);
      return { totalCount: total.length, preCount: pre.length, postCount: post.length, added: added.length, removed: removed.length, changed: changed.length };
    };
    return {
      storage: calc(discoverStorageKeysForService),
      preimages: calc(discoverPreimageKeysForService),
      lookup: calc(discoverLookupHistoryKeysForService),
    };
  }, [state, preState, serviceId]);

  if (activeService === null) {
    return null;
  }

  // Get query components
  const storageQuery = StorageQuery({ serviceId, preService: preService ?? undefined, preState, state, service: activeService, isDiffMode });
  const preimageQuery = PreimageQuery({ serviceId, preService: preService ?? undefined, preState, state, service: activeService, isDiffMode });
  const lookupHistoryQuery = LookupHistoryQuery({ serviceId, preService: preService ?? undefined, preState, state, service: activeService, isDiffMode });

  return (
    <div className={`border rounded p-4 ${backgroundClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <h5 className="font-semibold text-lg flex items-center gap-2">
          <code className="px-1 py-0.5 rounded text-xs font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
            δ[{serviceId}]
          </code>
          Service <span className="font-mono">{serviceId}</span>
        </h5>
        {isDiffMode && changeType !== 'normal' && (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            changeType === 'added' ? 'bg-green-200 text-green-800 dark:bg-green-800/60 dark:text-green-200' :
            changeType === 'removed' ? 'bg-red-200 text-red-800 dark:bg-red-800/60 dark:text-red-200' :
            'bg-yellow-200 text-yellow-800 dark:bg-yellow-800/60 dark:text-yellow-200'
          }`}>
            {changeType.toUpperCase()}
          </span>
        )}
      </div>

      <ServiceError preError={preError} postError={postError} />

      {postService === null && !preError && !postError && (
        <div className="text-gray-500 dark:text-gray-400 italic">Service not found</div>
      )}

      <div className="space-y-4">
        <ServiceInfo serviceData={serviceData} preState={preState} state={state} isDiffMode={isDiffMode} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full sm:grid-cols-3 grid-cols-1">
            <TabsTrigger 
              value="storage" 
              className={`flex justify-start items-center gap-2 ${
                isDiffMode && changeInfo && !changeInfo.hasServiceInfoChanges && changeInfo.hasStorageChanges 
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' 
                  : ''
              }`}
            >
              <code className="px-1 py-0.5 rounded text-xs font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                aₛ
              </code>
              <span className="flex items-center gap-1">
                <span>Storage</span>
                {!isDiffMode ? (
                  <span className="text-xs text-muted-foreground">({counts.storage.totalCount})</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {counts.storage.changed > 0 ? (
                      <>
                        ({counts.storage.changed}/{counts.storage.preCount}
                        {counts.storage.added > 0 && <span className="text-green-700 dark:text-green-400"> +{counts.storage.added}</span>}
                        {counts.storage.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{counts.storage.removed}</span>}
                        )
                      </>
                    ) : (
                      <>
                        ({counts.storage.preCount}
                        {counts.storage.added > 0 && <span className="text-green-700 dark:text-green-400"> +{counts.storage.added}</span>}
                        {counts.storage.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{counts.storage.removed}</span>}
                        )
                      </>
                    )}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="preimages" 
              className={`flex justify-start items-center gap-2 ${
                isDiffMode && changeInfo && !changeInfo.hasServiceInfoChanges && changeInfo.hasPreimageChanges 
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' 
                  : ''
              }`}
            >
              <code className="px-1 py-0.5 rounded text-xs font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                aₚ
              </code>
              <span className="flex items-center gap-1">
                <span>Preimages</span>
                {!isDiffMode ? (
                  <span className="text-xs text-muted-foreground">({counts.preimages.totalCount})</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {counts.preimages.changed > 0 ? (
                      <>
                        ({counts.preimages.changed}/{counts.preimages.preCount}
                        {counts.preimages.added > 0 && <span className="text-green-700 dark:text-green-400"> +{counts.preimages.added}</span>}
                        {counts.preimages.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{counts.preimages.removed}</span>}
                        )
                      </>
                    ) : (
                      <>
                        ({counts.preimages.preCount}
                        {counts.preimages.added > 0 && <span className="text-green-700 dark:text-green-400"> +{counts.preimages.added}</span>}
                        {counts.preimages.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{counts.preimages.removed}</span>}
                        )
                      </>
                    )}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="lookup-history" 
              className={`flex justify-start items-center gap-2 ${
                isDiffMode && changeInfo && !changeInfo.hasServiceInfoChanges && changeInfo.hasLookupHistoryChanges 
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' 
                  : ''
              }`}
            >
              <code className="px-1 py-0.5 rounded text-xs font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                aₗ
              </code>
              <span className="flex items-center gap-1">
                <span>Lookup History</span>
                {!isDiffMode ? (
                  <span className="text-xs text-muted-foreground">({counts.lookup.totalCount})</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {counts.lookup.changed > 0 ? (
                      <>
                        ({counts.lookup.changed}/{counts.lookup.preCount}
                        {counts.lookup.added > 0 && <span className="text-green-700 dark:text-green-400"> +{counts.lookup.added}</span>}
                        {counts.lookup.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{counts.lookup.removed}</span>}
                        )
                      </>
                    ) : (
                      <>
                        ({counts.lookup.preCount}
                        {counts.lookup.added > 0 && <span className="text-green-700 dark:text-green-400"> +{counts.lookup.added}</span>}
                        {counts.lookup.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{counts.lookup.removed}</span>}
                        )
                      </>
                    )}
                  </span>
                )}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="mb-4">
              {activeTab === 'storage' && storageQuery.renderQueryInput()}
              {activeTab === 'preimages' && preimageQuery.renderQueryInput()}
              {activeTab === 'lookup-history' && lookupHistoryQuery.renderQueryInput()}
            </div>

            <TabsContent value="storage" className="mt-0">
              {storageQuery.renderResults()}
            </TabsContent>
            <TabsContent value="preimages" className="mt-0">
              {preimageQuery.renderResults()}
            </TabsContent>
            <TabsContent value="lookup-history" className="mt-0">
              {lookupHistoryQuery.renderResults()}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceCard;
