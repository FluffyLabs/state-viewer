import {RawState, StfStateType} from "@/types/shared";

export function selectState(stateType: StfStateType, extractedState: { state: RawState; preState?: RawState; executedState?: RawState } | null) {
  // Determine which state to show based on stateType
  let currentState = extractedState?.state;
  let preState: Record<string, string> | undefined = undefined;

  if (stateType === 'pre_state' && extractedState?.preState) {
    currentState = extractedState.preState;
  } else if (stateType === 'diff' && extractedState?.preState) {
    preState = extractedState.preState;
  } else if (stateType === 'exec_diff' && extractedState?.executedState) {
    currentState = extractedState.executedState;
    preState = extractedState.state;
  }

  return { currentState, preState };
}
