import { useCallback, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { SearchInput } from './ui/SearchInput';
import RawStateViewer from './RawStateViewer';
import InspectStateViewer from './InspectStateViewer';
import { Tabs as TabsType, isValidTab } from '@/utils/stateViewerUtils';
import {StfStateType} from '@/types/shared';
import { calculateStateDiff, getChainSpecType } from '@/utils';
import {Button} from '@fluffylabs/shared-ui';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/trie/components/ui/dialog';

export interface StateViewerProps {
  preState?: Record<string, string>;
  state: Record<string, string>;
  title?: string;
  tab: TabsType;
  stateType: StfStateType;
  executionLog?: string[];
  changeView: (tab: TabsType, stateType: StfStateType) => void;
}

export const StateViewer = ({
  preState,
  state,
  title = "State Data",
  tab,
  stateType,
  executionLog = [],
  changeView,
}: StateViewerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExecutionLogOpen, setIsExecutionLogOpen] = useState(false);

  const handleTabChange = useCallback((newTab: string) => {
    if (isValidTab(newTab)) {
      changeView(newTab, stateType);
    } else {
      console.error(`Invalid tab: ${newTab}`);
    }
  }, [stateType, changeView]);

  const execDiffCount = useMemo(() => {
    if (stateType !== 'exec_diff' || !preState) {
      return null;
    }
    return Object.keys(calculateStateDiff(preState, state)).length;
  }, [stateType, preState, state]);

  return (
    <div>
      {stateType === 'exec_diff' && (
        <div className="mb-4 rounded-lg border border-muted-foreground/25 bg-muted/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              onClick={() => setIsExecutionLogOpen(true)}
              variant="secondary"
              size="sm"
            >
              Execution log
            </Button>
            <span className="text-sm text-muted-foreground">
              {execDiffCount && execDiffCount > 0
                ? `${execDiffCount} state difference${execDiffCount === 1 ? '' : 's'}`
                : 'No state differences detected'}
            </span>
          </div>
        </div>
      )}

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search state fields, or raw keys and values..."
        className="pb-2"
      />

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 pb-2">
          <TabsTrigger value="trie" disabled={stateType === 'diff' || stateType === 'exec_diff'}>Trie</TabsTrigger>
          <TabsTrigger value="encoded">Encoded</TabsTrigger>
          <TabsTrigger value="decoded">Decoded</TabsTrigger>
        </TabsList>

        <TabsContent value="encoded" className="mt-0">
          <RawStateViewer
            preState={preState}
            state={state}
            title={title}
            searchTerm={searchTerm}
          />
        </TabsContent>

        <TabsContent value="decoded" className="mt-0">
          <InspectStateViewer
            preState={preState}
            state={state}
            searchTerm={searchTerm}
            chainSpec={getChainSpecType()}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isExecutionLogOpen} onOpenChange={setIsExecutionLogOpen}>
        <DialogContent className="w-[90vw] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Execution log</DialogTitle>
            <DialogDescription>
              Captured console output from the last executed block.
            </DialogDescription>
          </DialogHeader>
          <pre className="mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-muted-foreground/30 bg-muted/20 p-3 font-mono text-sm text-foreground">
            {executionLog.length > 0
              ? executionLog.join('\n')
              : 'No execution logs captured yet. Run the block to see trace output here.'}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StateViewer;
