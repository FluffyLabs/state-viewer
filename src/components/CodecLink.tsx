import { useMemo } from "react";
import { ExternalLink} from "lucide-react";
import { getFieldInfo} from "@/utils/infoTooltipUtils";

export function CodecLink(
  {
    entryKey,
    value,
  }: {
    entryKey: string,
    value: string,
  },
) {
  const fieldInfo = useMemo(() => getFieldInfo(entryKey), [entryKey]);
  const hasInfo = fieldInfo;

  return hasInfo ? (
    <a
      className="inline-block flex-shrink-0 ml-1" 
      title="View decoded value"
      href={`https://codec.fluffylabs.dev/#?kind=${fieldInfo?.serializeName}&data=${value}`}
    >
      <ExternalLink 
        className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help"
      />
    </a>
  ) : null;
}
