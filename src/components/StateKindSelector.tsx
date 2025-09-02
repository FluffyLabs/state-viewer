import {StfStateType} from "@/utils";
import {Button} from "@fluffylabs/shared-ui";

type StateKindSelectorProps = {
  availableStates?: StfStateType[];
  selectedState?: StfStateType;
  changeStateType: (type: StfStateType) => void;
};

export function StateKindSelector({ availableStates, selectedState, changeStateType }: StateKindSelectorProps) {
  if (!availableStates || availableStates.length === 0) {
    return;
  }

  return (
    <div className="ml-4">
      <div className="flex gap-2 flex-wrap">
        {availableStates.map((stateType) => (
          <Button
            key={stateType}
            onClick={() => changeStateType(stateType)}
            variant={selectedState === stateType ? "default" : "outline"}
            size="sm"
          >
            {stateType === 'pre_state' ? 'Pre-State' :
              stateType === 'post_state' ? 'Post-State' : 'Diff'}
          </Button>
        ))}
      </div>
    </div>
  );
}
