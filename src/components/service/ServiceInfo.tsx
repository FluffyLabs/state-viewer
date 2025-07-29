
import { CompositeViewer } from '../viewer';
import { getServiceInfoWithId } from './serviceUtils';
import type { ServiceInfoProps } from './types';

const ServiceInfo = ({ serviceData, isDiffMode }: ServiceInfoProps) => {
  const { serviceId, preService, postService } = serviceData;
  const hasService = preService || postService;

  if (!hasService) {
    return null;
  }

  const hasChanged = isDiffMode && (
    (preService === null) !== (postService === null) ||
    (preService && postService && 
      JSON.stringify(getServiceInfoWithId(preService, serviceId)) !== 
      JSON.stringify(getServiceInfoWithId(postService, serviceId)))
  );

  return (
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
  );
};

export default ServiceInfo;