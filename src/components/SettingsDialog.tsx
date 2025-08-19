import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import * as Typeberry from '@typeberry/state-merkleization';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type UnknownRecord = Record<string, unknown>;

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const [selectedGpVersion, setSelectedGpVersion] = useState<string>('');
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuiteError, setApplySuiteError] = useState<string | null>(null);

  const mod = Typeberry as unknown as UnknownRecord;

  const GpVersionEnum: Record<string, string> | undefined = useMemo(() => {
    const val = mod['GpVersion'];
    return typeof val === 'object' && val !== null ? (val as Record<string, string>) : undefined;
  }, [mod]);

  const TestSuiteEnum: Record<string, string> | undefined = useMemo(() => {
    const val = mod['TestSuite'];
    return typeof val === 'object' && val !== null ? (val as Record<string, string>) : undefined;
  }, [mod]);

  const Compatibility: UnknownRecord | undefined = useMemo(() => {
    const val = mod['Compatibility'];
    return typeof val === 'function' || typeof val === 'object' ? (val as unknown as UnknownRecord) : undefined;
  }, [mod]);

  const gpOptions = useMemo(() => {
    if (!GpVersionEnum) return [] as string[];
    const values = Object.values(GpVersionEnum).filter((v) => typeof v === 'string') as string[];
    return [...new Set(values)];
  }, [GpVersionEnum]);

  const suiteOptions = useMemo(() => {
    if (!TestSuiteEnum) return [] as string[];
    const values = Object.values(TestSuiteEnum).filter((v) => typeof v === 'string') as string[];
    return [...new Set(values)];
  }, [TestSuiteEnum]);

  const hasOverride = typeof (Compatibility?.['override']) === 'function';
  const hasOverrideSuite = typeof (Compatibility?.['overrideSuite']) === 'function';

  useEffect(() => {
    if (!isOpen) return;
    setApplyError(null);
    setApplySuiteError(null);

    if (gpOptions.length > 0) {
      setSelectedGpVersion(gpOptions[0]);
    } else {
      setSelectedGpVersion('');
    }
    if (suiteOptions.length > 0) {
      setSelectedSuite(suiteOptions[0]);
    } else {
      setSelectedSuite('');
    }
  }, [isOpen, gpOptions, suiteOptions]);

  if (!isOpen) return null;

  const applyGpVersion = (value: string) => {
    setSelectedGpVersion(value);
    setApplyError(null);
    const fn = Compatibility?.['override'];
    if (typeof fn === 'function') {
      try {
        (fn as (v: unknown) => void)(value);
        window.location.reload();
      } catch (e) {
        setApplyError(e instanceof Error ? e.message : 'Failed to apply Gray Paper version.');
      }
    }
  };

  const applySuite = (value: string) => {
    setSelectedSuite(value);
    setApplySuiteError(null);
    const fn = Compatibility?.['overrideSuite'];
    if (typeof fn === 'function') {
      try {
        (fn as (s: unknown) => void)(value);
        window.location.reload();
      } catch (e) {
        setApplySuiteError(e instanceof Error ? e.message : 'Failed to apply Test Suite.');
      }
    }
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

        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Gray Paper Version</label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
              value={selectedGpVersion}
              onChange={(e) => applyGpVersion(e.target.value)}
              disabled={!hasOverride || gpOptions.length === 0}
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
            {!hasOverride && (
              <p className="text-xs text-muted-foreground">
                Compatibility.override is not available in the current package version.
              </p>
            )}
            {applyError && (
              <p className="text-xs text-destructive">{applyError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Test Vector Suite</label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
              value={selectedSuite}
              onChange={(e) => applySuite(e.target.value)}
              disabled={!hasOverrideSuite || suiteOptions.length === 0}
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
            {!hasOverrideSuite && (
              <p className="text-xs text-muted-foreground">
                Compatibility.overrideSuite is not available yet.
              </p>
            )}
            {applySuiteError && (
              <p className="text-xs text-destructive">{applySuiteError}</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
