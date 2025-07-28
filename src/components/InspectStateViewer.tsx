import { useMemo } from "react";
import { loadState, config, bytes } from "@typeberry/state-merkleization";

interface InspectStateViewerProps {
  state: Record<string, string>;
  title?: string;
}

const spec = config.tinyChainSpec;

const InspectStateViewer = ({ state, title = "State Data" }: InspectStateViewerProps) => {
  const stateAccess = useMemo(() => {
    return loadState(spec, Object.entries(state).map(([key, value]) => {
      return [
        bytes.Bytes.parseBytes(key, 31),
        bytes.BytesBlob.parseBlob(value),
      ];
    }))
  }, [state]);

  window.state = stateAccess;

  return (
    <div className="text-left p-4">
      <h3 className="text-lg font-semibold mb-4 hidden">{title} - JSON Dump</h3>
      <p className="text-muted">The state object is also exported in DevTools console as `state`.</p>
      <pre className="bg-muted p-4 rounded border text-sm overflow-auto max-h-96">
        <code role="code">{JSON.stringify(state, null, 2)}</code>
      </pre>
    </div>
  );
};

export default InspectStateViewer;
