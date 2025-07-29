import { useState, useMemo } from 'react';
import ServiceIdsInput from './service/ServiceIdsInput';
import ServiceCard from './service/ServiceCard';
import { parseServiceIds } from './service/serviceUtils';
import type { ServiceViewerProps, ServiceData } from './service/types';

const ServiceViewer = ({ preStateAccess, postStateAccess }: ServiceViewerProps) => {
  const [serviceIdsInput, setServiceIdsInput] = useState('0');

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
        postService = postStateAccess?.getService?.(serviceId) || null;
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
  }, [serviceIds, preStateAccess, postStateAccess]);

  const isDiffMode = preStateAccess !== undefined;

  return (
    <div className="space-y-4">
      <ServiceIdsInput
        value={serviceIdsInput}
        onChange={setServiceIdsInput}
      />

      <div className="space-y-4">
        {services.map((serviceData) => (
          <ServiceCard
            key={serviceData.serviceId}
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
