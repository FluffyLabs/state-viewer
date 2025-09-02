import { createRawKeyToFieldMap } from "@/constants/stateFields";
import { detectServiceKeyType } from "@/components/service";
import { generateServiceTooltipContent } from "@/components/service/EncodedServiceTooltip";

// Create mapping for known state field keys
const rawKeyToFieldMap = createRawKeyToFieldMap();

// Function to get field info for a raw key
export const getFieldInfo = (rawKey: string) => {
  return rawKeyToFieldMap.get(rawKey) || rawKeyToFieldMap.get(rawKey.substring(0, rawKey.length - 2));
};

// Function to get service info for a raw key
export const getServiceInfo = (rawKey: string) => {
  const serviceKeyInfo = detectServiceKeyType(rawKey);
  if (serviceKeyInfo.type) {
    return generateServiceTooltipContent(serviceKeyInfo);
  }
  return null;
};