import { useCallback, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { SearchInput } from './ui/SearchInput';
import RawStateViewer from './RawStateViewer';
import InspectStateViewer from './InspectStateViewer';
import { Tabs as TabsType, isValidTab } from '@/utils/stateViewerUtils';
import {StfStateType} from '@/types/shared';

export interface StateViewerProps {
  preState?: Record<string, string>;
  state: Record<string, string>;
  title?: string;
  tab: TabsType;
  stateType: StfStateType;
  changeView: (tab: TabsType, stateType: StfStateType) => void;
}

export const StateViewer = ({
  preState,
  state,
  title = "State Data",
  tab,
  stateType,
  changeView,
}: StateViewerProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = useCallback((newTab: string) => {
    if (isValidTab(newTab)) {
      changeView(newTab, stateType);
    } else {
      console.error(`Invalid tab: ${newTab}`);
    }
  }, [stateType, changeView]);

  return (
    <div>
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search state fields, or raw keys and values..."
        className="pb-2"
      />

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 pb-2">
          <TabsTrigger value="trie" disabled={stateType === 'diff' || stateType == 'exec_diff'}>Trie</TabsTrigger>
          <TabsTrigger value="encoded">Encoded</TabsTrigger>
          <TabsTrigger value="decoded-tiny">Decoded Tiny</TabsTrigger>
          <TabsTrigger value="decoded-full">Decoded Full</TabsTrigger>
        </TabsList>

        <TabsContent value="encoded" className="mt-0">
          <RawStateViewer
            preState={preState}
            state={state}
            title={title}
            searchTerm={searchTerm}
          />
        </TabsContent>

        <TabsContent value="decoded-tiny" className="mt-0">
          <InspectStateViewer
            preState={preState}
            state={state}
            searchTerm={searchTerm}
            chainSpec="tiny"
          />
        </TabsContent>

        <TabsContent value="decoded-full" className="mt-0">
          <InspectStateViewer
            preState={preState}
            state={state}
            searchTerm={searchTerm}
            chainSpec="full"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StateViewer;
