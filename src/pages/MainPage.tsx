import {useFileContext} from "@/contexts/FileContext";
import {AppState, StfStateType} from "@/types/shared";
import {useNavigate, useParams} from "react-router-dom";
import { UploadScreen } from "../components/UploadScreen";
import { StateViewer } from "../components/StateViewer";
import { Tabs, isValidTab } from "@/utils/stateViewerUtils";
import {isValidStateType} from "@/utils/jsonValidation";
import {useCallback} from "react";
import {selectState} from "./utils";

export function MainPage() {
  const { uploadState, extractedState, stateTitle, updateUploadState, clearUpload } = useFileContext();
  const navigate = useNavigate();
  const { tab, stateType } = useParams<{ tab: string; stateType: string }>();

  const validTab = isValidTab(tab) ? tab : 'encoded';
  const validStateType = isValidStateType(stateType) ? stateType : 'post_state';

  const appState: AppState = {
    uploadState,
    extractedState,
    stateTitle: stateTitle(validStateType),
    selectedState: validStateType,
  };

  const handleChangeView = useCallback((newTab: Tabs, stateType: StfStateType) => {
    if (newTab === 'trie') {
      navigate(`/trie/encoded/${stateType}`);
    } else {
      navigate(`/view/${newTab}/${stateType}`);
    }
  }, [navigate]);

  const changeStateType = useCallback((state: StfStateType) => {
    handleChangeView(validTab, state);
  }, [handleChangeView, validTab]);

  const { currentState, preState } = selectState(validStateType, extractedState);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <UploadScreen
        appState={appState}
        onUpdateUploadState={updateUploadState}
        onClearUpload={clearUpload}
        changeStateType={changeStateType}
      />
      {currentState && (
        <StateViewer
          state={currentState}
          preState={preState}
          title={appState.stateTitle}
          tab={validTab}
          stateType={validStateType}
          changeView={handleChangeView}
        />
      )}
    </div>
  );
}
