import { useMemo, useState } from "react";
import { loadState, config, bytes, serialize } from "@typeberry/state-merkleization";
import { CompositeViewer } from './viewer';
import ToStringViewer from './viewer/ToStringViewer';

interface InspectStateViewerProps {
  preState?: Record<string, string>;
  state: Record<string, string>;
  title?: string;
}

type DisplayMode = 'decoded' | 'raw' | 'string';

const spec = config.tinyChainSpec;

const stateFields = [
    { key: 'availabilityAssignment', notation: 'ρ', title: 'rho', description: 'Work-reports which have been reported but are not yet known to be available to a super-majority of validators', serialize: serialize.availabilityAssignment},
    { key: 'designatedValidatorData', notation: 'ι', title: 'iota', description: 'The validator keys and metadata to be drawn from next', serialize: serialize.designatedValidators },
    { key: 'nextValidatorData', notation: 'γₖ', title: 'gamma_k', description: 'The keys for the validators of the next epoch', serialize: serialize.safrole },
    { key: 'currentValidatorData', notation: 'κ', title: 'kappa', description: 'Current validators, who are the set of economic actors uniquely privileged to help build and maintain the Jam chain', serialize: serialize.currentValidators },
    { key: 'previousValidatorData', notation: 'λ', title: 'lambda', description: 'Previous validators data archived from past epochs', serialize: serialize.previousValidators },
    { key: 'disputesRecords', notation: 'ψ', title: 'psi', description: 'Judgements', serialize: serialize.disputesRecords },
    { key: 'timeslot', notation: 'τ', title: 'tau', description: 'The current time slot', serialize: serialize.timeslot },
    { key: 'entropy', notation: 'η', title: 'eta', description: 'An on-chain entropy pool', serialize: serialize.entropy },
    { key: 'authPools', notation: 'α', title: 'alpha', description: 'Authorizers available for each core (authorizer pool)', serialize: serialize.authPools },
    { key: 'authQueues', notation: 'φ', title: 'phi', description: 'A queue of authorizers for each core used to fill up the pool', serialize: serialize.authQueues },
    { key: 'recentBlocks', notation: 'β', title: 'beta', description: 'State of the blocks from recent history', serialize: serialize.recentBlocks },
    { key: 'statistics', notation: 'π', title: 'pi', description: 'Previous and current statistics of each validator, cores statistics and services statistics', serialize: serialize.statistics },
    { key: 'accumulationQueue', notation: 'θ', title: 'theta', description: 'Ready but not-yet-accumulated work-reports', serialize: serialize.accumulationQueue },
    { key: 'recentlyAccumulated', notation: 'ξ', title: 'xi', description: 'History of what has been accumulated', serialize: serialize.recentlyAccumulated },
    { key: 'ticketsAccumulator', notation: 'γₐ', title: 'gamma_a', description: 'The ticket accumulator - a series of highest-scoring ticket identifiers for the next epoch', serialize: serialize.safrole },
    { key: 'sealingKeySeries', notation: 'γₛ', title: 'gamma_s', description: 'Current epoch\'s slot-sealer series', serialize: serialize.safrole },
    { key: 'epochRoot', notation: 'γᵤ', title: 'gamma_z', description: 'The epoch\'s root, a Bandersnatch ring root composed with the one Bandersnatch key of each of the next epoch\'s validators', serialize: serialize.safrole },
    { key: 'privilegedServices', notation: 'χ', title: 'chi', description: 'Up to three services recognized as privileged', serialize: serialize.privilegedServices },
  ];

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
}: InspectStateViewerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('decoded');

  // Use provided states or fall back to legacy single state
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
    return stateData[rawKey];
  };

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

      {(preStateAccess || stateAccess) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium">State Fields</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 mr-2">Display:</span>
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={() => setDisplayMode('decoded')}
                  className={`px-3 py-1 text-xs ${
                    displayMode === 'decoded'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Decoded
                </button>
                <button
                  onClick={() => setDisplayMode('raw')}
                  className={`px-3 py-1 text-xs ${
                    displayMode === 'raw'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Raw
                </button>
                <button
                  onClick={() => setDisplayMode('string')}
                  className={`px-3 py-1 text-xs ${
                    displayMode === 'string'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  String
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 overflow-hidden">
            {stateFields.map(({ key, notation, title, description, serialize }) => {
              const preValue = preStateAccess?.[key as keyof typeof preStateAccess];
              const postValue = stateAccess?.[key as keyof typeof stateAccess];
              const rawKey = serialize?.key?.toString();
              const preRawValue = rawKey ? getRawValue(rawKey, preState) : undefined;
              const postRawValue = rawKey ? getRawValue(rawKey, state) : undefined;
              
              // Determine values based on display mode
              const getDisplayValue = (decoded: unknown, raw: string | undefined) => {
                switch (displayMode) {
                  case 'decoded': return decoded;
                  case 'raw': return raw;
                  case 'string': return decoded;
                  default: return decoded;
                }
              };
              
              const currentPreValue = getDisplayValue(preValue, preRawValue);
              const currentPostValue = getDisplayValue(postValue, postRawValue);
              const hasValue = currentPreValue !== undefined || currentPostValue !== undefined;
              const hasChanged = isDiffMode && !isDeepEqual(currentPreValue, currentPostValue);

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
                        {key}
                        {hasChanged && <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-1 rounded">CHANGED</span>}
                      </div>
                      {rawKey && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          Raw key: {rawKey}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">{description}</div>
                      <div className="mt-2">
                        {!hasValue ? (
                          <div className="text-xs text-gray-400">Not found</div>
                        ) : isDiffMode && hasChanged ? (
                          <div className="space-y-2">
                            {currentPreValue !== undefined && (
                              <div>
                                <div className="text-xs font-medium text-red-700 mb-1">Before:</div>
                                <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                                  {displayMode === 'string' ? (
                                    <ToStringViewer value={currentPreValue} />
                                  ) : displayMode === 'raw' ? (
                                    <pre className="mt-1 pl-2 text-xs font-mono bg-gray-50 rounded p-2 break-all overflow-auto">
                                      {String(currentPreValue || '')}
                                    </pre>
                                  ) : (
                                    <CompositeViewer value={currentPreValue} />
                                  )}
                                </div>
                              </div>
                            )}
                            {currentPostValue !== undefined && (
                              <div>
                                <div className="text-xs font-medium text-green-700 mb-1">After:</div>
                                <div className="bg-green-50 border border-green-200 p-2 rounded text-xs">
                                  {displayMode === 'string' ? (
                                    <ToStringViewer value={currentPostValue} />
                                  ) : displayMode === 'raw' ? (
                                    <pre className="mt-1 pl-2 text-xs font-mono bg-gray-50 rounded p-2 break-all overflow-auto">
                                      {String(currentPostValue || '')}
                                    </pre>
                                  ) : (
                                    <CompositeViewer value={currentPostValue} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-100 p-2 rounded text-xs">
                            {displayMode === 'string' ? (
                              <ToStringViewer value={currentPostValue || currentPreValue} />
                            ) : displayMode === 'raw' ? (
                              <pre className="mt-1 pl-2 text-xs font-mono bg-gray-50 rounded p-2 break-all overflow-auto">
                                {String((currentPostValue || currentPreValue) || '')}
                              </pre>
                            ) : (
                              <CompositeViewer value={currentPostValue || currentPreValue} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};


function isDeepEqual<T>(preValue: T, postValue: T): boolean {
  if (preValue === postValue) {
    return true;
  }

  if (preValue === null || preValue === undefined) {
    return postValue === preValue;
  }

  if (postValue === null || postValue === undefined) {
    return postValue === preValue;
  }

  if (typeof preValue !== typeof postValue) {
    return false;
  }

  if (Array.isArray(preValue) && Array.isArray(postValue)) {
    return preValue.length === postValue.length && preValue.every((item, index) => isDeepEqual(item, postValue[index]));
  }

  if (Object.prototype.hasOwnProperty.call(preValue, 'toString')) {
    return preValue.toString() === postValue.toString();
  }

  for (const k of Object.keys(preValue)) {
    const isOk = isDeepEqual(
      preValue[k as keyof typeof preValue],
      postValue[k as keyof typeof postValue])
    if (!isOk) {
      return false;
    }
  }

  return true;
}

export default InspectStateViewer;