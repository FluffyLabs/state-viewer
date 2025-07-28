import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import RawStateViewer from './RawStateViewer';
import InspectStateViewer from './InspectStateViewer';

interface StateViewerProps {
  preState?: Record<string, string>;
  state: Record<string, string>;
  title?: string;
}

const StateViewer = ({
  preState,
  state,
  title = "State Data",
}: StateViewerProps) => {
  return (
    <div>
      <Tabs defaultValue="raw" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="raw">Encoded</TabsTrigger>
          <TabsTrigger value="inspect">Decoded</TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="mt-0">
          <RawStateViewer
            preState={preState}
            state={state}
            title={title}
          />
        </TabsContent>

        <TabsContent value="inspect" className="mt-0">
          <InspectStateViewer
            preState={preState}
            state={state}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StateViewer;
