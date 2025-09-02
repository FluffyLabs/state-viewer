import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Header, AppsSidebar, Button } from "@fluffylabs/shared-ui";
import { Settings } from "lucide-react";
import ToolName from "@/assets/tool-name.svg";
import SettingsDialog from "@/components/SettingsDialog";
import { utils } from "@typeberry/state-merkleization";
import { FileProvider } from "@/contexts/FileContext";
import {MainPage} from "./pages/MainPage";
import {TriePage} from "./pages/TriePage";

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
            size="sm"
            aria-label="Settings"
            title="Settings"
            forcedColorScheme="dark"
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

        <div className="w-full bg-background h-[calc(100dvh-87px)] overflow-y-auto">
          <Routes>
            <Route
              path=""
              index
              element={ <MainPage /> }
            />
            <Route
              path="/view/:tab/:stateType"
              element={ <MainPage /> }
            />
            <Route
              path="/trie/:tab/:stateType"
              element={ <TriePage /> }
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

