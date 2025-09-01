import { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Header, AppsSidebar } from "@fluffylabs/shared-ui";
import { Settings } from "lucide-react";
import ToolName from "@/assets/tool-name.svg";
import { UploadScreen, StateViewer } from "@/components";
import { Button } from "@/components/ui/Button";
import SettingsDialog from "@/components/SettingsDialog";
import { TriePage } from "@/trie/TriePage";
import { utils } from "@typeberry/state-merkleization";
import { FileProvider, useFileContext } from "@/contexts";
import type { AppState } from "@/types/shared";




const VersionDisplay = () => {
  const currentVersion = utils.CURRENT_VERSION as string;
  const currentSuite = utils.CURRENT_SUITE as string;

  return (
    <span className="text-sm text-muted-foreground mr-2">
      GP: {currentVersion}, Suite: {currentSuite}
    </span>
  );
};

const AppHeader = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  return (
    <Header
      toolNameSrc={ToolName}
      ghRepoName="state-view"
      keepNameWhenSmall
      endSlot={
        <div className="flex items-center">
          <VersionDisplay />
          <Button
            onClick={onOpenSettings}
            variant="secondary"
            size="sm"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      }
    />
  );
};

const AppContent = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const { uploadState, extractedState, stateTitle, stateRows, updateUploadState, clearUpload } = useFileContext();

  const appState: AppState = {
    uploadState,
    extractedState,
    stateTitle,
  };

  return (
    <div className="flex flex-col overflow-hidden h-[100dvh]">
      <div className="h-[87px]">
        <AppHeader onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>
      <div className="flex h-full">
        <div className="max-sm:hidden">
          <AppsSidebar
            activeLink="state"
            className="h-full"
            enableDarkModeToggle={true}
          />
        </div>

        <div className="w-full bg-background h-[calc(100dvh-87px)]">
          <Routes>
            <Route
              index
              element={
                <div className="p-4 h-full overflow-y-auto">
                  <UploadScreen
                    appState={appState}
                    onUpdateUploadState={updateUploadState}
                    onClearUpload={clearUpload}
                  />
                </div>
              }
            />
            <Route
              path="/encoded"
              element={
                <div className="p-4 h-full overflow-y-auto">
                  {extractedState ? (
                    <StateViewer
                      state={extractedState.state}
                      preState={extractedState.preState}
                      title={stateTitle}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No state data available</p>
                      <Button onClick={() => navigate('/')}>
                        Go back to upload
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
            <Route
              path="/decoded-tiny"
              element={
                <div className="p-4 h-full overflow-y-auto">
                  {extractedState ? (
                    <StateViewer
                      state={extractedState.state}
                      preState={extractedState.preState}
                      title={stateTitle}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No state data available</p>
                      <Button onClick={() => navigate('/')}>
                        Go back to upload
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
            <Route
              path="/decoded-full"
              element={
                <div className="p-4 h-full overflow-y-auto">
                  {extractedState ? (
                    <StateViewer
                      state={extractedState.state}
                      preState={extractedState.preState}
                      title={stateTitle}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No state data available</p>
                      <Button onClick={() => navigate('/')}>
                        Go back to upload
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
            <Route
              path="/trie"
              element={
                <div className="p-4 h-full overflow-hidden">
                  {stateRows.length > 0 ? (
                    <div className="h-full flex flex-col">
                      <div className="mb-4">
                        <Button onClick={() => navigate(-1)} variant="secondary">
                          ← Back
                        </Button>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <TriePage rows={stateRows} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No state data available for trie view</p>
                      <Button onClick={() => navigate('/')}>
                        Go back to upload
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
          </Routes>
        </div>
      </div>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

function App() {
  return (
    <FileProvider>
      <AppContent />
    </FileProvider>
  );
}

export default App;
