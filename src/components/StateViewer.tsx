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
import { useFileContext } from '@/contexts/FileContext';

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
  const { showPvmLogs } = useFileContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExecutionLogOpen, setIsExecutionLogOpen] = useState(false);
  const [filterPvmLogs, setFilterPvmLogs] = useState(true);

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

  const filteredExecutionLog = useMemo(() => {
    // If PVM logs are being captured and the user wants to filter them out
    if (showPvmLogs && !filterPvmLogs) {
      return executionLog.filter(line => !line.startsWith('INSANE'));
    }
    return executionLog;
  }, [executionLog, showPvmLogs, filterPvmLogs]);

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
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filter-pvm-logs"
                checked={showPvmLogs && filterPvmLogs}
                onChange={(e) => setFilterPvmLogs(e.target.checked)}
                disabled={!showPvmLogs}
                className="h-4 w-4 rounded border-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label
                htmlFor="filter-pvm-logs"
                className={`text-sm ${showPvmLogs ? 'text-foreground cursor-pointer' : 'text-muted-foreground cursor-not-allowed'}`}
              >
                Show PVM trace logs
              </label>
            </div>
            {!showPvmLogs && (
              <p className="text-xs text-muted-foreground ml-6">
                PVM trace logs are disabled. Enable them in Settings to capture detailed execution traces.
              </p>
            )}
          </div>
          <pre className="mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-muted-foreground/30 bg-muted/20 p-3 font-mono text-sm text-foreground">
            {filteredExecutionLog.length > 0
              ? filteredExecutionLog.join('\n')
              : executionLog.length > 0
                ? 'All logs filtered out. Check the "Show PVM trace logs" option above.'
                : 'No execution logs captured yet. Run the block to see trace output here.'}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StateViewer;
