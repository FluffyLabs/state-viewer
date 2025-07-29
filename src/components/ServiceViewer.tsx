import { useState, useMemo, useEffect } from 'react';
import ServiceIdsInput from './service/ServiceIdsInput';
import ServiceCard from './service/ServiceCard';
import { parseServiceIds, extractServiceIdsFromState } from './service/serviceUtils';
import type { ServiceData } from './service/types';
import { StateAccess } from '@/types/service';

export interface ServiceViewerProps {
  preState?: Record<string, string>;
  state: Record<string, string>;
  preStateAccess?: StateAccess;
  stateAccess: StateAccess;
}

const ServiceViewer = ({ preStateAccess, stateAccess, preState, state }: ServiceViewerProps) => {
  const discoveredServiceIds = useMemo(() => {
    return extractServiceIdsFromState(state);
  }, [state]);

  const [serviceIdsInput, setServiceIdsInput] = useState(() => {
    return discoveredServiceIds.length > 0 ? discoveredServiceIds.join(', ') : '0';
  });

  useEffect(() => {
    if (discoveredServiceIds.length > 0) {
      setServiceIdsInput(discoveredServiceIds.join(', '));
    }
  }, [discoveredServiceIds]);

  const serviceIds = useMemo(() => {
    return parseServiceIds(serviceIdsInput);
  }, [serviceIdsInput]);

  const services = useMemo((): ServiceData[] => {
    return serviceIds.map(serviceId => {
      let preService = null;
      let postService = null;
      let preError = null;
      let postError = null;

      try {
        preService = preStateAccess?.getService?.(serviceId) || null;
      } catch (err) {
        preError = err instanceof Error ? err.message : 'Unknown error';
      }

      try {
        postService = stateAccess.getService(serviceId) || null;
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
  }, [serviceIds, preStateAccess, stateAccess]);

  const isDiffMode = preStateAccess !== undefined;

  if (isDiffMode) {
    return (
      <div className="space-y-4 font-semibold mb-4">
        <h4 className="text-md font-medium mb-3">Service Accounts</h4>
        Diff mode not supported for services yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-4">
      <h4 className="text-md font-medium mb-3">Service Accounts</h4>
      <ServiceIdsInput
        value={serviceIdsInput}
        onChange={setServiceIdsInput}
      />

      <div className="space-y-4">
        {services.map((serviceData) => (
          <ServiceCard
            key={serviceData.serviceId}
            preState={preState}
            state={state}
            serviceData={serviceData}
            isDiffMode={isDiffMode}
          />
        ))}

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
