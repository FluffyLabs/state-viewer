
import { useMemo, useState } from 'react';
import ServiceError from './ServiceError';
import ServiceInfo from './ServiceInfo';
import StorageQuery from './StorageQuery';
import PreimageQuery from './PreimageQuery';
import LookupHistoryQuery from './LookupHistoryQuery';
import { getServiceChangeType, getComprehensiveServiceChangeType, formatServiceIdUnsigned } from './serviceUtils';
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
  const formattedId = formatServiceIdUnsigned(serviceId);

  const changeType = isDiffMode ? getServiceChangeType(serviceData) : 'normal';
  const changeInfo = useMemo(() => {
    return getComprehensiveServiceChangeType(serviceData, state, preState);
  }, [serviceData, state, preState]);
  
  const backgroundClass = isDiffMode ? {
    'added': 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700',
    'removed': 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700',
    'changed': 'bg-yellow-50/0 dark:bg-yellow-900/0 border-yellow-200 dark:border-yellow-700',
    'normal': 'bg-gray-50 dark:bg-gray-900/20'
  }[changeType] : 'bg-gray-50 dark:bg-gray-900/20';

  if (serviceData.postError || serviceData.preError) {
    return (
      <div className={`border rounded p-4 ${backgroundClass}`}>
        <div className="flex items-center gap-2 mb-3">
          <h5 className="font-semibold text-lg flex items-center gap-2">
            <code className="px-1 py-0.5 rounded text-xs font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
              δ[{formattedId}]
            </code>
            Service <span className="font-mono">{formattedId}</span>
          </h5>
        </div>

        <ServiceError preError={preError} postError={postError} />
      </div>
    );
  }

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
            δ[{formattedId}]
          </code>
          Service <span className="font-mono">{formattedId}</span>
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
                isDiffMode && changeInfo && !changeInfo.hasServiceInfoChanges && changeInfo.storage.hasAnyChanges 
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
                  <span className="text-xs text-muted-foreground">({changeInfo.storage.totalCount})</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {changeInfo.storage.changed > 0 ? (
                      <>
                        ({changeInfo.storage.changed}/{changeInfo.storage.preCount}
                        {changeInfo.storage.added > 0 && <span className="text-green-700 dark:text-green-400"> +{changeInfo.storage.added}</span>}
                        {changeInfo.storage.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{changeInfo.storage.removed}</span>}
                        )
                      </>
                    ) : (
                      <>
                        ({changeInfo.storage.preCount}
                        {changeInfo.storage.added > 0 && <span className="text-green-700 dark:text-green-400"> +{changeInfo.storage.added}</span>}
                        {changeInfo.storage.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{changeInfo.storage.removed}</span>}
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
                isDiffMode && changeInfo && !changeInfo.hasServiceInfoChanges && changeInfo.preimages.hasAnyChanges 
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
                  <span className="text-xs text-muted-foreground">({changeInfo.preimages.totalCount})</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {changeInfo.preimages.changed > 0 ? (
                      <>
                        ({changeInfo.preimages.changed}/{changeInfo.preimages.preCount}
                        {changeInfo.preimages.added > 0 && <span className="text-green-700 dark:text-green-400"> +{changeInfo.preimages.added}</span>}
                        {changeInfo.preimages.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{changeInfo.preimages.removed}</span>}
                        )
                      </>
                    ) : (
                      <>
                        ({changeInfo.preimages.preCount}
                        {changeInfo.preimages.added > 0 && <span className="text-green-700 dark:text-green-400"> +{changeInfo.preimages.added}</span>}
                        {changeInfo.preimages.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{changeInfo.preimages.removed}</span>}
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
                isDiffMode && changeInfo && !changeInfo.hasServiceInfoChanges && changeInfo.lookup.hasAnyChanges 
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
                  <span className="text-xs text-muted-foreground">({changeInfo.lookup.totalCount})</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {changeInfo.lookup.changed > 0 ? (
                      <>
                        ({changeInfo.lookup.changed}/{changeInfo.lookup.preCount}
                        {changeInfo.lookup.added > 0 && <span className="text-green-700 dark:text-green-400"> +{changeInfo.lookup.added}</span>}
                        {changeInfo.lookup.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{changeInfo.lookup.removed}</span>}
                        )
                      </>
                    ) : (
                      <>
                        ({changeInfo.lookup.preCount}
                        {changeInfo.lookup.added > 0 && <span className="text-green-700 dark:text-green-400"> +{changeInfo.lookup.added}</span>}
                        {changeInfo.lookup.removed > 0 && <span className="text-red-700 dark:text-red-400"> /-{changeInfo.lookup.removed}</span>}
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
