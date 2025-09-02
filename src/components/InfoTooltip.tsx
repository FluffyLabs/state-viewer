import {createRawKeyToFieldMap} from "@/constants/stateFields";
import {useMemo} from "react";
import {detectServiceKeyType} from "./service";
import {generateServiceTooltipContent} from "./service/EncodedServiceTooltip";
import { Popover } from './ui/Popover';
import {Info} from "lucide-react";

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


export function InfoTooltip(
  { entryKey }: { entryKey: string },
) {
  const fieldInfo = useMemo(() => getFieldInfo(entryKey), [entryKey, getFieldInfo]);
  const serviceInfo = useMemo(() => getServiceInfo(entryKey), [entryKey, getServiceInfo]);
  const hasTooltip = fieldInfo || serviceInfo;

  return hasTooltip && (
              <Popover
              trigger={
                <div className="flex-shrink-0 ml-1">
                  <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help" />
                </div>
              }
              content={
                fieldInfo ? (
                  <div className="space-y-1">
                    <div className="font-semibold">{fieldInfo.key}</div>
                    <div className="text-xs opacity-75">
                      {fieldInfo.notation} ({fieldInfo.title})
                    </div>
                    <div className="text-xs">{fieldInfo.description}</div>
                  </div>
                ) : (
                  serviceInfo
                )
              }
              position="right"
              triggerOn="hover"
              />
            );
}

