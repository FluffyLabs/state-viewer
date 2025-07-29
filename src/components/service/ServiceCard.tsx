
import ServiceError from './ServiceError';
import ServiceInfo from './ServiceInfo';
import StorageQuery from './StorageQuery';
import PreimageQuery from './PreimageQuery';
import LookupHistoryQuery from './LookupHistoryQuery';
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

  return (
    <div className={`border rounded p-4 bg-gray-50`}>
      <div className="flex items-center gap-2 mb-3">
        <h5 className="font-semibold text-lg">Service <span className="font-mono">{serviceId}</span></h5>
      </div>

      <ServiceError preError={preError} postError={postError} />

      {postService === null && !preError && !postError && (
        <div className="text-gray-500 italic">Service not found</div>
      )}

      <div className="space-y-4">
        <ServiceInfo serviceData={serviceData} preState={preState} state={state} isDiffMode={isDiffMode} />
        <StorageQuery serviceId={serviceId} preState={preState} state={state} service={activeService} />
        <PreimageQuery serviceId={serviceId} preState={preState} state={state} service={activeService} />
        <LookupHistoryQuery serviceId={serviceId} preState={preState} state={state} service={activeService} />
      </div>
    </div>
  );
};

export default ServiceCard;
