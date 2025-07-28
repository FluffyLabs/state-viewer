interface InspectStateViewerProps {
  state: Record<string, string>;
  title?: string;
}

const InspectStateViewer = ({ state, title = "State Data" }: InspectStateViewerProps) => {
  return (
    <div className="text-left p-4">
      <h3 className="text-lg font-semibold mb-4 hidden">{title} - JSON Dump</h3>
      <pre className="bg-muted p-4 rounded border text-sm overflow-auto max-h-96">
        <code role="code">{JSON.stringify(state, null, 2)}</code>
      </pre>
    </div>
  );
};

export default InspectStateViewer;
