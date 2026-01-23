import {StfStateType} from "@/types/shared";
import {Button} from "@fluffylabs/shared-ui";
import type * as block from '@typeberry/lib/block';
import { Popover } from '@/components/ui/Popover';
import {Loader2} from "lucide-react";

type StateKindSelectorProps = {
  availableStates?: StfStateType[];
  selectedState?: StfStateType;
  changeStateType: (type: StfStateType) => void;
  stateBlock?: block.Block;
  executedState?: unknown;
  runBlock?: (stateBlock: block.Block) => void;
  runBlockLoading?: boolean;
};

export function StateKindSelector({
  availableStates,
  selectedState,
  changeStateType,
  stateBlock,
  executedState,
  runBlock,
  runBlockLoading
}: StateKindSelectorProps) {
  if (!availableStates || availableStates.length === 0) {
    return;
  }

  return (
    <div className="ml-4">
      <div className="flex gap-2 flex-wrap justify-end">
        {availableStates.map((stateType) => (
          <Button
            key={stateType}
            onClick={() => changeStateType(stateType)}
            variant={selectedState === stateType ? "primary" : "secondary"}
            size="sm"
          >
            {stateType === 'pre_state' ? 'pre-state' :
              stateType === 'post_state' ? 'post-state' : 'diff'}
          </Button>
        ))}
        {stateBlock !== undefined && executedState === undefined && runBlock && (
          <Popover
            trigger={
              <Button
                onClick={() => runBlock(stateBlock)}
                variant="tertiary"
                size="sm"
                disabled={runBlockLoading}
              >
                {runBlockLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Running...
                  </span>
                ) : (
                  'run block'
                )}
              </Button>
            }
            content="Run the block in typeberry to compare with expected post state"
            position="top"
            triggerOn="hover"
          />
        )}
        {stateBlock !== undefined && executedState !== undefined && (
          <Button
            onClick={() => changeStateType('exec_diff')}
            variant={selectedState === 'exec_diff' ? "primary" : "secondary"}
            size="sm"
          >
            exec diff
          </Button>
        )}
      </div>
    </div>
  );
}
