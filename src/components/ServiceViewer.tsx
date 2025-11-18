import { useState, useMemo, useEffect } from 'react';
import ServiceIdsInput from './service/ServiceIdsInput';
import ServiceCard from './service/ServiceCard';
import { parseServiceIds, extractServiceIdsFromState, getComprehensiveServiceChangeType, formatServiceIdUnsigned, serviceMatchesSearch } from './service/serviceUtils';
import type { ServiceData } from './service/types';
import { StateAccess } from '@/types/service';

export interface ServiceViewerProps {
  preState?: Record<string, string>;
  state: Record<string, string>;
  preStateAccess?: StateAccess;
  stateAccess: StateAccess;
  searchTerm?: string;
}

const ServiceViewer = ({ preStateAccess, stateAccess, preState, state, searchTerm = '' }: ServiceViewerProps) => {
  const discoveredServiceIds = useMemo(() => {
    return extractServiceIdsFromState(state);
  }, [state]);

  const [serviceIdsInput, setServiceIdsInput] = useState(() => {
    return discoveredServiceIds.length > 0 ? discoveredServiceIds.map(formatServiceIdUnsigned).join(', ') : '0';
  });

  useEffect(() => {
    if (discoveredServiceIds.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServiceIdsInput(discoveredServiceIds.map(formatServiceIdUnsigned).join(', '));
    }
  }, [discoveredServiceIds]);

  const serviceIds = useMemo(() => {
    return parseServiceIds(serviceIdsInput);
  }, [serviceIdsInput]);

  const isDiffMode = preStateAccess !== undefined;

  const services = useMemo((): ServiceData[] => {
    const allServices = serviceIds.map(serviceId => {
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

    const searchFilteredServices = allServices.filter(serviceData => 
      serviceMatchesSearch(serviceData, searchTerm, state, preState)
    );

    if (isDiffMode && preState) {
      return searchFilteredServices.filter(serviceData => {
        const changeInfo = getComprehensiveServiceChangeType(serviceData, state, preState);
        return changeInfo.hasAnyChanges;
      });
    }

    return searchFilteredServices;
  }, [serviceIds, preStateAccess, stateAccess, isDiffMode, preState, state, searchTerm]);

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
            {isDiffMode 
              ? `No services found with changes matching the given criteria${searchTerm ? ` and search term "${searchTerm}"` : ''}. Services may exist but have no changes.`
              : `No services found matching the given criteria${searchTerm ? ` and search term "${searchTerm}"` : ''}.`
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceViewer;
