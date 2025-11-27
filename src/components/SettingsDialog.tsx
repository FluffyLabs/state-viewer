import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { utils } from '@typeberry/lib';
import {Button} from '@fluffylabs/shared-ui';
import { useFileContext } from '@/contexts/FileContext';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const { showPvmLogs, setShowPvmLogs } = useFileContext();
  const [selectedGpVersion, setSelectedGpVersion] = useState<string>(window.process.env.GP_VERSION ?? "");
  const [selectedSuite, setSelectedSuite] = useState<string>(window.process.env.TEST_SUITE ?? "");
  const [selectedChainSpec, setSelectedChainSpec] = useState<string>(
    window.sessionStorage.getItem('CHAIN_SPEC') ?? "tiny"
  );

  const gpOptions = useMemo(() => {
    const values = Object.values(utils.GpVersion).filter((v) => typeof v === 'string') as string[];
    return [...new Set(values)];
  }, []);

  const suiteOptions = useMemo(() => {
    const values = Object.values(utils.TestSuite).filter((v) => typeof v === 'string') as string[];
    return [...new Set(values)];
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedGpVersion(utils.CURRENT_VERSION as unknown as string);
    setSelectedSuite(utils.CURRENT_SUITE as unknown as string);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    window.sessionStorage.setItem('GP_VERSION', selectedGpVersion);
    window.sessionStorage.setItem('TEST_SUITE', selectedSuite);
    window.sessionStorage.setItem('CHAIN_SPEC', selectedChainSpec);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 text-left">
          <div className="space-y-2">
            <label htmlFor="gp-version-select" className="text-sm text-muted-foreground">Gray Paper Version</label>
            <select
              id="gp-version-select"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
              value={selectedGpVersion}
              onChange={(e) => setSelectedGpVersion(e.target.value)}
            >
              {gpOptions.length === 0 ? (
                <option value="">No versions available</option>
              ) : (
                gpOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="test-suite-select" className="text-sm text-muted-foreground">Test Vector Suite</label>
            <select
              id="test-suite-select"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
              value={selectedSuite}
              onChange={(e) => setSelectedSuite(e.target.value)}
            >
              {suiteOptions.length === 0 ? (
                <option value="">No suites available</option>
              ) : (
                suiteOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="chain-spec-select" className="text-sm text-muted-foreground">Chain Specification</label>
            <select
              id="chain-spec-select"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
              value={selectedChainSpec}
              onChange={(e) => setSelectedChainSpec(e.target.value)}
            >
              <option value="tiny">Tiny</option>
              <option value="full">Full</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Execution Logs</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-pvm-logs-setting"
                checked={showPvmLogs}
                onChange={(e) => setShowPvmLogs(e.target.checked)}
                className="h-4 w-4 rounded border-muted-foreground/30"
              />
              <label htmlFor="show-pvm-logs-setting" className="text-sm text-foreground cursor-pointer">
                Capture PVM trace logs (INSANE level)
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, detailed PVM trace logs will be captured during block execution. This may generate a large volume of logs.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-start space-x-2">
          <Button onClick={handleApply}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
