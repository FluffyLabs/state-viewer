
import { CompositeViewer } from '../viewer';
import CompositeDiff from '../viewer/CompositeDiff';
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
    <div className="break-all">
      {/* Raw Key Display */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">Key: {rawKey}
          { isDiffMode && !hasChanged && (" (no change)") }
        </div>
      </div>

      {isDiffMode && hasChanged ? (
        <CompositeDiff
          beforeValue={preService ? getServiceInfoWithId(preService, serviceId) : undefined}
          afterValue={postService ? getServiceInfoWithId(postService, serviceId) : undefined}
          beforeRawValue={preStateValue}
          afterRawValue={stateValue}
        />
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
