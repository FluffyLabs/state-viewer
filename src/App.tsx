import { useState } from "react";
import { Route, Routes } from "react-router";
import { Header, AppsSidebar } from "@fluffylabs/shared-ui";
import ToolName from "@/assets/tool-name.svg";
import { UploadScreen } from "@/components";

const AppHeader = () => {
  return (
    <Header 
      toolNameSrc={ToolName} 
      ghRepoName="state-view"
    />
  );
};



function App() {
  const [jsonData, setJsonData] = useState<string | null>(null);
  const [jsonFormat, setJsonFormat] = useState<string | null>(null);

  const handleJsonUploaded = (content: string, format: string) => {
    setJsonData(content);
    setJsonFormat(format);
    console.log('JSON uploaded:', { format, content: content.substring(0, 100) + '...' });
  };

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
            enableDarkModeToggle={false}
          />
        </div>

        <div className="w-full bg-background h-[calc(100dvh-87px)]">
          <div className="p-4 h-full overflow-y-auto">
            <Routes>
              <Route index element={<UploadScreen onJsonUploaded={handleJsonUploaded} />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;