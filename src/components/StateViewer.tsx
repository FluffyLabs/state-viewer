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
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search state fields, or raw keys and values..."
        className="pb-2"
      />

      <Tabs defaultValue="raw" className="w-full">
        <TabsList className="grid w-full grid-cols-2 pb-2">
          <TabsTrigger value="raw">Encoded</TabsTrigger>
          <TabsTrigger value="inspect">Decoded</TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="mt-0 border rounded-lg">
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
