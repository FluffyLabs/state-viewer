
import ServiceError from './ServiceError';
import ServiceInfo from './ServiceInfo';
import StorageQuery from './StorageQuery';
import PreimageQuery from './PreimageQuery';
import LookupHistoryQuery from './LookupHistoryQuery';
import { getServiceChangeType } from './serviceUtils';
import type { RawState, ServiceData } from './types';

export interface ServiceCardProps {
  preState?: RawState;
  state: RawState;
  serviceData: ServiceData;
  isDiffMode: boolean;
}

const ServiceCard = ({ serviceData, isDiffMode, preState, state }: ServiceCardProps) => {
  const { serviceId, preService, postService, preError, postError } = serviceData;
  const activeService = postService || preService;
  if (activeService === null) {
    return null;
  }

  const changeType = isDiffMode ? getServiceChangeType(serviceData) : 'normal';
  const backgroundClass = isDiffMode ? {
    'added': 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700',
    'removed': 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700', 
    'changed': 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
    'normal': 'bg-gray-50 dark:bg-gray-900/20'
  }[changeType] : 'bg-gray-50 dark:bg-gray-900/20';

  return (
    <div className={`border rounded p-4 ${backgroundClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <h5 className="font-semibold text-lg">Service <span className="font-mono">{serviceId}</span></h5>
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
        <StorageQuery serviceId={serviceId} preState={preState} state={state} service={activeService} isDiffMode={isDiffMode} />
        <PreimageQuery serviceId={serviceId} preState={preState} state={state} service={activeService} isDiffMode={isDiffMode} />
        <LookupHistoryQuery serviceId={serviceId} preState={preState} state={state} service={activeService} isDiffMode={isDiffMode} />
      </div>
    </div>
  );
};

export default ServiceCard;
