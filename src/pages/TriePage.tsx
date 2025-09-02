import {useFileContext} from "@/contexts/FileContext";
import {isValidStateType} from "@/utils/jsonValidation";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import {selectState} from "./utils";
import {lazy, Suspense, useMemo} from "react";
import {Button} from "@fluffylabs/shared-ui";
import {X} from "lucide-react";

const TrieView = lazy(async () => ({ default: (await import('@/trie/TrieView')).TrieView }));

export function TriePage() {
  const { extractedState } = useFileContext();
  const navigate = useNavigate();
  const { stateType } = useParams<{ tab: string; stateType: string }>();


  const { currentState } = isValidStateType(stateType) ? selectState(stateType, extractedState) : {};

  // Convert state to Row[] format for trie
  const stateRows = useMemo(() => {
    if (!currentState) {
      return null;
    }

    return Object.entries(currentState).map(([key, value]) => ({
      key: key.substring(2),
      value: value.substring(2),
    }));
  }, [currentState]);

  if (!stateRows) {
    return <Navigate to="/" />;
  }

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
        <Suspense fallback={<div className="font-mono p-4">Loading...</div>}>
          <TrieView rows={stateRows} />
        </Suspense>
      </div>
    </div>
  );
}

