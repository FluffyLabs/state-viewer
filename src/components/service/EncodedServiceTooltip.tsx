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
          <a className="underline" href="https://graypaper.fluffylabs.dev/#/ab2cdbd/3b7d033b7d03?v=0.7.2" target="gp">Gray Paper</a>
        </div>
      );
    case 'storage-or-lookup':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Storage or lookup history</div>
          <div className="text-xs opacity-75">a_s[.] | a_l[.]</div>
          <div className="text-xs">Part of service {formattedId}</div>
          <a className="underline" href="https://graypaper.fluffylabs.dev/#/ab2cdbd/3bac033bac03?v=0.7.2" target="gp">Gray Paper</a>
        </div>
      );
    case 'preimage':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Preimage</div>
          <div className="text-xs opacity-75">a_p[.]</div>
          <div className="text-xs">Part of service {formattedId}</div>
          <a className="underline" href="https://graypaper.fluffylabs.dev/#/ab2cdbd/3bc9033bc903?v=0.7.2" target="gp">Gray Paper</a>
        </div>
      );
    case 'lookup':
      return (
        <div className="space-y-1">
          <div className="font-semibold">Lookup History</div>
          <div className="text-xs opacity-75">a_l[.]</div>
          <div className="text-xs">Part of service {formattedId}</div>
          <a className="underline" href="https://graypaper.fluffylabs.dev/#/ab2cdbd/3bea033bea03?v=0.7.2" target="gp">Gray Paper</a>
        </div>
      );
    default:
      return null;
  }
};
