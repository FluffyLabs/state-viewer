import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import RawStateViewer from './RawStateViewer';
import InspectStateViewer from './InspectStateViewer';

interface StateViewerProps {
  state: Record<string, string>;
  title?: string;
}

const StateViewer = ({ state, title = "State Data" }: StateViewerProps) => {
  return (
    <div>
      <Tabs defaultValue="raw" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="raw">Raw</TabsTrigger>
          <TabsTrigger value="inspect">Decoded</TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="mt-0">
          <RawStateViewer state={state} title={title} />
        </TabsContent>

        <TabsContent value="inspect" className="mt-0">
          <InspectStateViewer state={state} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StateViewer;
