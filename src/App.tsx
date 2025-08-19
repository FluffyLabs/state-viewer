import { useState } from "react";
import { Route, Routes } from "react-router";
import { Header, AppsSidebar } from "@fluffylabs/shared-ui";
import { Settings } from "lucide-react";
import ToolName from "@/assets/tool-name.svg";
import { UploadScreen } from "@/components";
import { Button } from "@/components/ui/Button";
import SettingsDialog from "@/components/SettingsDialog";

const AppHeader = () => {
  return (
    <Header
      toolNameSrc={ToolName}
      ghRepoName="state-view"
    />
  );
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col overflow-hidden h-[100dvh]">
      <div className="h-[87px] relative">
        <AppHeader />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Button onClick={() => setIsSettingsOpen(true)} variant="secondary" size="sm">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
        </div>
      </div>
      <div className="flex h-full">
        <div className="max-sm:hidden">
          <AppsSidebar
            activeLink="trie"
            className="h-full"
            enableDarkModeToggle={true}
          />
        </div>

        <div className="w-full bg-background h-[calc(100dvh-87px)]">
          <div className="p-4 h-full overflow-y-auto">
            <Routes>
              <Route index element={<UploadScreen />} />
            </Routes>
          </div>
        </div>
      </div>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
