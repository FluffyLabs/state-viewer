
import ServiceError from './ServiceError';
import ServiceInfo from './ServiceInfo';
import StorageQuery from './StorageQuery';
import PreimageQuery from './PreimageQuery';
import LookupHistoryQuery from './LookupHistoryQuery';
import { getServiceInfoWithId } from './serviceUtils';
import type { ServiceCardProps } from './types';

const ServiceCard = ({ serviceData, isDiffMode }: ServiceCardProps) => {
  const { serviceId, preService, postService, preError, postError } = serviceData;
  const hasService = preService || postService;
  const activeService = postService || preService;

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
    <div className={`border rounded p-4 ${hasChanged ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <h5 className="font-semibold text-lg">Service {serviceId}</h5>
        {hasChanged && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">CHANGED</span>}
      </div>

      <ServiceError preError={preError} postError={postError} />

      {!hasService && !preError && !postError && (
        <div className="text-gray-500 italic">Service not found</div>
      )}

      {hasService && (
        <div className="space-y-4">
          <ServiceInfo serviceData={serviceData} isDiffMode={isDiffMode} />
          <StorageQuery serviceId={serviceId} service={activeService!} disabled={!hasService} />
          <PreimageQuery serviceId={serviceId} service={activeService!} disabled={!hasService} />
          <LookupHistoryQuery serviceId={serviceId} service={activeService!} disabled={!hasService} />
        </div>
      )}
    </div>
  );
};

export default ServiceCard;