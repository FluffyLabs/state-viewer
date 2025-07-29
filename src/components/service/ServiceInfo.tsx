
import { CompositeViewer } from '../viewer';
import { getServiceInfoWithId } from './serviceUtils';
import { serviceData as serviceDataSerializer } from '../../constants/serviceFields';
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

  const activeService = postService || preService;
  let rawKey = null;
  try {
    rawKey = activeService ? serviceDataSerializer(activeService.serviceId as never).key : null;
  } catch (err) {
    console.error('Error getting raw key:', err);
  }

  return (
    <div>
      <h6 className="font-medium text-sm mb-2">Service Info</h6>
      
      {/* Raw Key Display */}
      {rawKey && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-1">Raw Key:</div>
          <div className="bg-gray-50 border p-2 rounded text-xs">
            <CompositeViewer value={rawKey} />
          </div>
        </div>
      )}

      {isDiffMode && hasChanged ? (
        <div className="space-y-2">
          {preService && (
            <div>
              <div className="text-xs font-medium text-red-700 mb-1">Before:</div>
              <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                <CompositeViewer 
                  value={getServiceInfoWithId(preService, serviceId)} 
                  rawValue={(() => {
                    try {
                      return serviceDataSerializer(preService.serviceId as never).Codec.rawValue(preService);
                    } catch (err) {
                      console.error('Error getting raw value:', err);
                      return undefined;
                    }
                  })()}
                  showModeToggle={true} 
                />
              </div>
            </div>
          )}
          {postService && (
            <div>
              <div className="text-xs font-medium text-green-700 mb-1">After:</div>
              <div className="bg-green-50 border border-green-200 p-2 rounded text-xs">
                <CompositeViewer 
                  value={getServiceInfoWithId(postService, serviceId)} 
                  rawValue={(() => {
                    try {
                      return serviceDataSerializer(postService.serviceId as never).Codec.rawValue(postService);
                    } catch (err) {
                      console.error('Error getting raw value:', err);
                      return undefined;
                    }
                  })()}
                  showModeToggle={true} 
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 p-2 rounded text-xs">
          <CompositeViewer
            value={getServiceInfoWithId(postService || preService, serviceId)}
            rawValue={(() => {
              try {
                return activeService ? serviceDataSerializer(activeService.serviceId as never).Codec.rawValue(activeService) : undefined;
              } catch (err) {
                console.error('Error getting raw value:', err);
                return undefined;
              }
            })()}
          />
        </div>
      )}
    </div>
  );
};

export default ServiceInfo;