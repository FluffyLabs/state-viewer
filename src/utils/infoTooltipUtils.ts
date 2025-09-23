import { createRawKeyToFieldMap } from "@/constants/stateFields";
import { detectServiceId, ServiceEntryType } from "@/components/service";
import { generateServiceTooltipContent } from "@/components/service/EncodedServiceTooltip";

// Create mapping for known state field keys
const rawKeyToFieldMap = createRawKeyToFieldMap();

// Function to get field info for a raw key
export const getFieldInfo = (rawKey: string) => {
  return rawKeyToFieldMap.get(rawKey) || rawKeyToFieldMap.get(rawKey.substring(0, rawKey.length - 2));
};

// Function to get service info for a raw key
export const getServiceInfo = (rawKey: string, serviceData: Map<number, ServiceEntryType[]>) => {
  const serviceId = detectServiceId(rawKey);
  if (serviceId === null) {
    return null;
  }

  const entries = serviceData.get(serviceId);
  if (entries === undefined) {
    return null;
  }

  const entry = entries.find(v => v.key.startsWith(rawKey));
  if (entry === undefined) {
    return null;
  }
  return generateServiceTooltipContent(serviceId, entry);
};
