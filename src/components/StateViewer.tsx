import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { SearchInput } from './ui/SearchInput';
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
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <div className="bg-background rounded-t-lg border border-b-0">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search across all state data..."
          className=""
        />
      </div>
      <Tabs defaultValue="raw" className="w-full border border-t-0 rounded-b-lg">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="raw">Encoded</TabsTrigger>
          <TabsTrigger value="inspect">Decoded</TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="mt-0">
          <RawStateViewer
            preState={preState}
            state={state}
            title={title}
            searchTerm={searchTerm}
          />
        </TabsContent>

        <TabsContent value="inspect" className="mt-0">
          <InspectStateViewer
            preState={preState}
            state={state}
            searchTerm={searchTerm}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StateViewer;
