import React from 'react';
import {ServiceKeyInfo} from './serviceUtils';

export const generateServiceTooltipContent = (keyInfo: ServiceKeyInfo): React.ReactNode => {
  if (!keyInfo.type || keyInfo.serviceId === null) return null;
  
  switch (keyInfo.type) {
    case 'service-info':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Service {keyInfo.serviceId}</div>
          <div className="text-xs opacity-75">δ[{keyInfo.serviceId}]</div>
          <div className="text-xs">Service Account Info</div>
        </div>
      );
    case 'storage':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Storage</div>
          <div className="text-xs opacity-75">a_s[.]</div>
          <div className="text-xs">Part of service {keyInfo.serviceId}</div>
        </div>
      );
    case 'preimage':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Preimage</div>
          <div className="text-xs opacity-75">a_p[.]</div>
          <div className="text-xs">Part of service {keyInfo.serviceId}</div>
        </div>
      );
    case 'lookup-history':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Lookup History</div>
          <div className="text-xs opacity-75">a_l[.]</div>
          <div className="text-xs">Part of service {keyInfo.serviceId}</div>
        </div>
      );
    default:
      return null;
  }
};
