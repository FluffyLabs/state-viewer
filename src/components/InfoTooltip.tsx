import { useMemo } from "react";
import { Popover } from './ui/Popover';
import { Info } from "lucide-react";
import { getFieldInfo, getServiceInfo } from "@/utils/infoTooltipUtils";

export function InfoTooltip(
  { entryKey }: { entryKey: string },
) {
  const fieldInfo = useMemo(() => getFieldInfo(entryKey), [entryKey]);
  const serviceInfo = useMemo(() => getServiceInfo(entryKey), [entryKey]);
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