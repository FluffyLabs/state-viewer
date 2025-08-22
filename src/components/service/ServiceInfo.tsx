
import { CompositeViewer } from '../viewer';
import { getServiceInfoWithId } from './serviceUtils';
import { serviceData as serviceDataSerializer } from '../../constants/serviceFields';
import type { RawState, ServiceData } from './types';

export interface ServiceInfoProps {
  preState?: RawState;
  state: RawState;
  serviceData: ServiceData;
  isDiffMode: boolean;
}

const ServiceInfo = ({ serviceData, isDiffMode, preState, state }: ServiceInfoProps) => {
  const { serviceId, preService, postService } = serviceData;
  const activeService = postService || preService;
  if (activeService === null) {
    return null;
  }

  const rawKey = serviceDataSerializer(activeService.serviceId as never).key.toString()
    .substring(0, 64);

  const preStateValue = preState?.[rawKey];
  const stateValue = state[rawKey];

  const hasChanged = isDiffMode && preStateValue !== stateValue;

  return (
    <div>
      {/* Raw Key Display */}
      <div className="mb-3">
        <div className="text-xs font-mono mb-1">Key: {rawKey}
          { isDiffMode && !hasChanged && (" (no change)") }
        </div>
      </div>

      {isDiffMode && hasChanged ? (
        <div className="space-y-2">
          {preService && (
            <div>
              <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Before:</div>
              <div className="p-2 rounded text-xs border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                <CompositeViewer
                  value={getServiceInfoWithId(preService, serviceId)}
                  rawValue={preStateValue}
                  showModeToggle={true}
                />
              </div>
            </div>
          )}
          {postService && (
            <div>
              <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">After:</div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-2 rounded text-xs">
                <CompositeViewer
                  value={getServiceInfoWithId(postService, serviceId)}
                  rawValue={stateValue}
                  showModeToggle={true}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
          <CompositeViewer
            value={getServiceInfoWithId(activeService, serviceId)}
            rawValue={stateValue}
            showModeToggle={true}
          />
        </div>
      )}
    </div>
  );
};

export default ServiceInfo;
