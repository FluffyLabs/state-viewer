import { Route, Routes } from "react-router";
import { Header, AppsSidebar } from "@fluffylabs/shared-ui";
import ToolName from "@/assets/tool-name.svg";
import { HelloWorld, UploadScreen } from "@/components";

const AppHeader = () => {
  return (
    <Header
      toolNameSrc={ToolName}
      ghRepoName="state-view"
    />
  );
};



function App() {
  return (
    <div className="flex flex-col overflow-hidden h-[100dvh]">
      <div className="h-[87px]">
        <AppHeader />
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
              <Route path="/hello" element={<HelloWorld />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
