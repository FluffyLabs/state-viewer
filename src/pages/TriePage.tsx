import {useFileContext} from "@/contexts/FileContext";
import {TrieView} from "@/trie/TrieView";
import {isValidStateType} from "@/utils/jsonValidation";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import {selectState} from "./utils";
import {useMemo} from "react";
import {Button} from "@fluffylabs/shared-ui";
import {X} from "lucide-react";

export function TriePage() {
  const { extractedState } = useFileContext();
  const navigate = useNavigate();
  const { stateType } = useParams<{ tab: string; stateType: string }>();
  if (!isValidStateType(stateType)) {
    return <Navigate to="/" />;
  }

  const { currentState } = selectState(stateType, extractedState);
  console.log(currentState, stateType, extractedState);
  if (!currentState) {
    return <Navigate to="/" />;
  }

  // Convert state to Row[] format for trie
  const stateRows = useMemo(() => {
    return Object.entries(currentState).map(([key, value]) => ({
      key: key.substring(2),
      value: value.substring(2),
    }));
  }, [currentState]);

  return (
    <div className="p-2 h-full flex">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="absolute top-0 right-0 cursor-pointer z-5"
        >
          <X />
        </Button>

        <TrieView rows={stateRows} />
      </div>
    </div>
  );
}

