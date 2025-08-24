import { useState } from "react";
import { Route, Routes } from "react-router";
import { Header, AppsSidebar } from "@fluffylabs/shared-ui";
import { Settings } from "lucide-react";
import ToolName from "@/assets/tool-name.svg";
import { UploadScreen } from "@/components";
import { Button } from "@/components/ui/Button";
import SettingsDialog from "@/components/SettingsDialog";

const AppHeader = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  return (
    <Header
      toolNameSrc={ToolName}
      ghRepoName="state-view"
      keepNameWhenSmall
      endSlot={
        <Button
          onClick={onOpenSettings}
          variant="secondary"
          size="sm"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      }
    />
  );
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col overflow-hidden h-[100dvh]">
      <div className="h-[87px]">
        <AppHeader onOpenSettings={() => setIsSettingsOpen(true)} />
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
