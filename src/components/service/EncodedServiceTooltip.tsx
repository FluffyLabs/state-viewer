import React from 'react';
import {formatServiceIdUnsigned, ServiceEntryType} from './serviceUtils';

export const generateServiceTooltipContent = (serviceId: number, entry: ServiceEntryType): React.ReactNode => {
  const formattedId = formatServiceIdUnsigned(serviceId);
  
  switch (entry.kind) {
    case 'service-info':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Service {formattedId}</div>
          <div className="text-xs opacity-75">δ[{formattedId}]</div>
          <div className="text-xs">Service Account Info</div>
        </div>
      );
    case 'storage-or-lookup':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Storage or lookup history</div>
          <div className="text-xs opacity-75">a_s[.] | a_l[.]</div>
          <div className="text-xs">Part of service {formattedId}</div>
        </div>
      );
    case 'preimage':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Preimage</div>
          <div className="text-xs opacity-75">a_p[.]</div>
          <div className="text-xs">Part of service {formattedId}</div>
        </div>
      );
    case 'lookup':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Lookup History</div>
          <div className="text-xs opacity-75">a_l[.]</div>
          <div className="text-xs">Part of service {formattedId}</div>
        </div>
      );
    default:
      return null;
  }
};
