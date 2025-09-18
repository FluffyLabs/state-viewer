import { useMemo, useState } from "react";
import { config, bytes, state_merkleization as lib } from "@typeberry/lib";
import { CompositeViewer } from './viewer';
import ServiceViewer from './ServiceViewer';
import type { StateAccess } from '../types/service';

import { filterStateFieldsWithRawKeysAndValues, highlightSearchMatchesWithContext } from '@/utils/searchUtils';

interface InspectStateViewerProps {
  preState?: Record<string, string>;
  state: Record<string, string>;
  title?: string;
  searchTerm?: string;
  chainSpec?: 'tiny' | 'full';
}

const useLoadState = (
  state: Record<string, string> | undefined,
  setError: (error: string | null) => void,
  ctx: string,
  chainSpec: 'tiny' | 'full',
) => {
  return useMemo(() => {
    if (!state) return null;

    try {
      setError(null);
      const spec = chainSpec === 'tiny' ? config.tinyChainSpec : config.fullChainSpec;
      return lib.loadState(spec, Object.entries(state).map(([key, value]) => {
        return [
          bytes.Bytes.parseBytes(key, 31),
          bytes.BytesBlob.parseBlob(value),
        ];
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`${ctx}: ${errorMessage}`);
      return null;
    }
  }, [state, setError, ctx, chainSpec]);
}

const InspectStateViewer = ({
  preState,
  state,
  title = "State Data",
  searchTerm: externalSearchTerm,
  chainSpec = 'tiny',
}: InspectStateViewerProps) => {
  const [error, setError] = useState<string | null>(null);
  const searchTerm = externalSearchTerm || '';
  const isDiffMode = preState !== undefined;

  const preStateAccess = useLoadState(preState, setError, 'preState', chainSpec);
  const stateAccess = useLoadState(state, setError, 'postState', chainSpec);

  // Expose all states to the global window object for DevTools inspection.
  (window as unknown as { preState: unknown }).preState = preStateAccess;
  (window as unknown as { postState: unknown }).postState = stateAccess;
  (window as unknown as { state: unknown }).state = stateAccess;

  // Function to get raw value from original state data
  const getRawValue = (rawKey: string, stateData: Record<string, string> | undefined) => {
    if (!stateData || !rawKey) return undefined;
    return stateData[rawKey] || stateData[rawKey.substring(0, rawKey.length - 2)];
  };

  // Filter state fields based on search term with enhanced raw key and value support
  const filteredStateFields = useMemo(() => {
    const combinedStateData = { ...preState, ...state };
    return filterStateFieldsWithRawKeysAndValues(searchTerm, combinedStateData);
  }, [searchTerm, preState, state]);

  return (
    <div className="text-left py-4">
      <h3 className="text-lg font-semibold mb-4 hidden">{title}</h3>
      {!error && (
        <p className="text-xs text-muted-foreground mb-4">
          The state object is also exported in DevTools console as
          {isDiffMode ? "`preState` and `postState`." : "`state`."}
        </p>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded mb-4">
          <strong>Error loading state:</strong> {error}
        </div>
      )}

      {stateAccess !== null && (<ServiceViewer
        preState={preState}
        state={state}
        preStateAccess={(preStateAccess ?? undefined) as StateAccess | undefined}
        stateAccess={stateAccess as unknown as StateAccess}
        searchTerm={searchTerm}
      />)}

      {(preStateAccess || stateAccess) && (
        <div className="space-y-4">

          <h4 className="text-md font-medium mb-3">State Fields</h4>
          <div className="flex flex-col gap-3 overflow-hidden break-all">
            {filteredStateFields.map(({ key, notation, title, description, serialize }) => {
              // Safely access state values with error handling
              let preValue: unknown = undefined;
              let postValue: unknown = undefined;
              let fieldError: string | null = null;

              try {
                preValue = preStateAccess?.[key as keyof typeof preStateAccess];
                postValue = stateAccess?.[key as keyof typeof stateAccess];
              } catch (err) {
                fieldError = err instanceof Error ? err.message : 'Failed to access state field';
              }

              const rawKey = serialize?.key?.toString();
              const preRawValue = rawKey ? getRawValue(rawKey, preState) : undefined;
              const postRawValue = rawKey ? getRawValue(rawKey, state) : undefined;

              const hasValue = preValue !== undefined || postValue !== undefined;
              const hasChanged = isDiffMode && (
                serialize?.key === lib.serialize.safrole.key
                ? String(preValue) !== String(postValue)
                :preRawValue !== postRawValue
              );

              if (isDiffMode && !hasChanged) {
                return null;
              }

              return (
                <div key={key} className={`border rounded p-3 ${hasChanged ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : 'bg-gray-50 dark:bg-gray-900/20'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <code className={`px-2 py-1 rounded text-xs font-mono w-8 h-6 flex items-center justify-center ${
                        hasChanged ? 'bg-yellow-200 dark:bg-yellow-800/60 text-yellow-800 dark:text-yellow-200' : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                      }`}>
                        {notation}
                      </code>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-center">{title}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        {highlightSearchMatchesWithContext(key, searchTerm, false)}
                        {hasChanged && <span className="ml-2 text-xs bg-yellow-200 dark:bg-yellow-800/60 text-yellow-800 dark:text-yellow-200 px-1 rounded">CHANGED</span>}
                      </div>
                      {rawKey && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                          Key: {highlightSearchMatchesWithContext(rawKey, searchTerm, true)}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{highlightSearchMatchesWithContext(description, searchTerm, false)}</div>
                      <div className="mt-2">
                        {fieldError ? (
                          <div className="space-y-2">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-2 rounded text-xs">
                              <div className="text-red-700 dark:text-red-100 font-medium mb-1">Error accessing field:</div>
                              <div className="text-red-600 dark:text-red-200 text-xs mb-2">{fieldError}</div>
                              {(preRawValue || postRawValue) && (
                                <div>
                                  <div className="text-gray-700 dark:text-gray-300 font-medium mb-1">Raw value:</div>
                                  <code className="text-xs bg-gray-100 dark-bg-background p-1 rounded block">
                                    {postRawValue || preRawValue}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : !hasValue ? (
                          <div className="text-xs text-gray-400 dark:text-gray-500">Not found</div>
                        ) : isDiffMode && hasChanged ? (
                          <div className="space-y-2">
                            {preValue !== undefined && (
                              <div>
                                <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Before:</div>
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-2 rounded text-xs">
                                  <CompositeViewer
                                    value={preValue}
                                    rawValue={preRawValue}
                                    showModeToggle={true}
                                  />
                                </div>
                              </div>
                            )}
                            {postValue !== undefined && (
                              <div>
                                <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">After:</div>
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-2 rounded text-xs">
                                  <CompositeViewer
                                    value={postValue}
                                    rawValue={postRawValue}
                                    showModeToggle={true}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-100 dark-bg-background p-2 rounded text-xs">
                            <CompositeViewer
                              value={postValue || preValue}
                              rawValue={postRawValue || preRawValue}
                              showModeToggle={true}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredStateFields.length === 0 && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                No state fields match your search term "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default InspectStateViewer;
