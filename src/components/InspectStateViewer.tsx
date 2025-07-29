import { useMemo, useState } from "react";
import { loadState, config, bytes, serialize as stateSerialize } from "@typeberry/state-merkleization";
import { CompositeViewer } from './viewer';
import ServiceViewer from './ServiceViewer';
import type { StateAccess } from '../types/service';

import { filterStateFieldsWithRawKeysAndValues, highlightSearchMatchesWithContext } from '@/utils/searchUtils';



interface InspectStateViewerProps {
  preState?: Record<string, string>;
  state: Record<string, string>;
  title?: string;
  searchTerm?: string;
}



const spec = config.tinyChainSpec;

const useLoadState = (
  state: Record<string, string> | undefined,
  setError: (error: string | null) => void,
  ctx: string,
) => {
  return useMemo(() => {
    if (!state) return null;

    try {
      setError(null);
      return loadState(spec, Object.entries(state).map(([key, value]) => {
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
  }, [state, setError, ctx]);
}

const InspectStateViewer = ({
  preState,
  state,
  title = "State Data",
  searchTerm: externalSearchTerm,
}: InspectStateViewerProps) => {
  const [error, setError] = useState<string | null>(null);
  const searchTerm = externalSearchTerm || '';
  const isDiffMode = preState !== undefined;

  const preStateAccess = useLoadState(preState, setError, 'preState');
  const stateAccess = useLoadState(state, setError, 'postState');

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
    <div className="text-left p-4">
      <h3 className="text-lg font-semibold mb-4 hidden">{title}</h3>
      {!error && (
        <p className="text-xs text-muted mb-4">
          The state object is also exported in DevTools console as
          {isDiffMode ? "`preState` and `postState`." : "`state`."}
        </p>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error loading state:</strong> {error}
        </div>
      )}

      {stateAccess !== null && (<ServiceViewer
        preState={preState}
        state={state}
        preStateAccess={(preStateAccess ?? undefined) as StateAccess | undefined}
        stateAccess={stateAccess as unknown as StateAccess}
      />)}

      {(preStateAccess || stateAccess) && (
        <div className="space-y-4">

          <h4 className="text-md font-medium mb-3">State Fields</h4>
          <div className="flex flex-col gap-3 overflow-hidden">
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
                serialize.key === stateSerialize.safrole.key
                ? String(preValue) !== String(postValue)
                :preRawValue !== postRawValue
              );

              if (isDiffMode && !hasChanged) {
                return null;
              }

              return (
                <div key={key} className={`border rounded p-3 ${hasChanged ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <code className={`px-2 py-1 rounded text-xs font-mono w-8 h-6 flex items-center justify-center ${
                        hasChanged ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {notation}
                      </code>
                      <span className="text-xs text-gray-500 w-16 text-center">{title}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-medium text-gray-900">
                        {highlightSearchMatchesWithContext(key, searchTerm, false)}
                        {hasChanged && <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-1 rounded">CHANGED</span>}
                      </div>
                      {rawKey && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          Key: {highlightSearchMatchesWithContext(rawKey, searchTerm, true)}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">{highlightSearchMatchesWithContext(description, searchTerm, false)}</div>
                      <div className="mt-2">
                        {fieldError ? (
                          <div className="space-y-2">
                            <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                              <div className="text-red-700 font-medium mb-1">Error accessing field:</div>
                              <div className="text-red-600 text-xs mb-2">{fieldError}</div>
                              {(preRawValue || postRawValue) && (
                                <div>
                                  <div className="text-gray-700 font-medium mb-1">Raw value:</div>
                                  <code className="text-xs bg-gray-100 p-1 rounded block">
                                    {postRawValue || preRawValue}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : !hasValue ? (
                          <div className="text-xs text-gray-400">Not found</div>
                        ) : isDiffMode && hasChanged ? (
                          <div className="space-y-2">
                            {preValue !== undefined && (
                              <div>
                                <div className="text-xs font-medium text-red-700 mb-1">Before:</div>
                                <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
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
                                <div className="text-xs font-medium text-green-700 mb-1">After:</div>
                                <div className="bg-green-50 border border-green-200 p-2 rounded text-xs">
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
                          <div className="bg-gray-100 p-2 rounded text-xs">
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
