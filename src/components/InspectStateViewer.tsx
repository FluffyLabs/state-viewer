import { useMemo, useState } from "react";
import { loadState, config, bytes } from "@typeberry/state-merkleization";

interface InspectStateViewerProps {
  state: Record<string, string>;
  title?: string;
}

const spec = config.tinyChainSpec;

const InspectStateViewer = ({ state, title = "State Data" }: InspectStateViewerProps) => {
  const [error, setError] = useState<string | null>(null);

  const stateAccess = useMemo(() => {
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
      setError(errorMessage);
      return null;
    }
  }, [state]);

  (window as unknown as { state: unknown }).state = stateAccess;

  const stateFields = [
    { key: 'availabilityAssignment', notation: 'ρ', title: 'rho', description: 'Work-reports which have been reported but are not yet known to be available to a super-majority of validators' },
    { key: 'designatedValidatorData', notation: 'ι', title: 'iota', description: 'The validator keys and metadata to be drawn from next' },
    { key: 'nextValidatorData', notation: 'γₖ', title: 'gamma_k', description: 'The keys for the validators of the next epoch' },
    { key: 'currentValidatorData', notation: 'κ', title: 'kappa', description: 'Current validators, who are the set of economic actors uniquely privileged to help build and maintain the Jam chain' },
    { key: 'previousValidatorData', notation: 'λ', title: 'lambda', description: 'Previous validators data archived from past epochs' },
    { key: 'disputesRecords', notation: 'ψ', title: 'psi', description: 'Judgements' },
    { key: 'timeslot', notation: 'τ', title: 'tau', description: 'The current time slot' },
    { key: 'entropy', notation: 'η', title: 'eta', description: 'An on-chain entropy pool' },
    { key: 'authPools', notation: 'α', title: 'alpha', description: 'Authorizers available for each core (authorizer pool)' },
    { key: 'authQueues', notation: 'φ', title: 'phi', description: 'A queue of authorizers for each core used to fill up the pool' },
    { key: 'recentBlocks', notation: 'β', title: 'beta', description: 'State of the blocks from recent history' },
    { key: 'statistics', notation: 'π', title: 'pi', description: 'Previous and current statistics of each validator, cores statistics and services statistics' },
    { key: 'accumulationQueue', notation: 'θ', title: 'theta', description: 'Ready but not-yet-accumulated work-reports' },
    { key: 'recentlyAccumulated', notation: 'ξ', title: 'xi', description: 'History of what has been accumulated' },
    { key: 'ticketsAccumulator', notation: 'γₐ', title: 'gamma_a', description: 'The ticket accumulator - a series of highest-scoring ticket identifiers for the next epoch' },
    { key: 'sealingKeySeries', notation: 'γₛ', title: 'gamma_s', description: 'Current epoch\'s slot-sealer series' },
    { key: 'epochRoot', notation: 'γᵤ', title: 'gamma_z', description: 'The epoch\'s root, a Bandersnatch ring root composed with the one Bandersnatch key of each of the next epoch\'s validators' },
    { key: 'privilegedServices', notation: 'χ', title: 'chi', description: 'Up to three services recognized as privileged' },
  ];

  return (
    <div className="text-left p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {stateAccess && (
        <p className="text-muted mb-4">The state object is also exported in DevTools console as `state`.</p>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error loading state:</strong> {error}
        </div>
      )}

      {stateAccess && (
        <div className="space-y-4">
          <h4 className="text-md font-medium mb-3">State Fields</h4>
          <div className="grid gap-3">
            {stateFields.map(({ key, notation, title, description }) => (
              <div key={key} className="border rounded p-3 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono w-8 h-6 flex items-center justify-center">
                      {notation}
                    </code>
                    <span className="text-xs text-gray-500 w-16 text-center">{title}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium text-gray-900">{key}</div>
                    <div className="text-sm text-gray-600 mt-1">{description}</div>
                    <div className="mt-2">
                      {key in stateAccess ? (
                        <div className="bg-gray-100 p-2 rounded text-xs">
                          {(() => {
                            const value = stateAccess[key as keyof typeof stateAccess];
                            return <CompositeViewer value={value} />;
                          })()}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">Not found</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CompositeViewer = ({ value }: { value: unknown }) => {
  if (value === null) {
    return <span className="text-gray-500 italic">null</span>;
  }
  if (Array.isArray(value)) {
    return <ArrayViewer array={value} />;
  }
  if (typeof value === 'object' && Object.hasOwnProperty.call(value, 'toJSON')) {
    return <ToStringViewer value={value} />;
  }
  if (typeof value === 'object' && Object.prototype.toString === value.toString) {
    return <ObjectViewer value={value as Record<string, unknown>} />;
  }
  return <ToStringViewer value={value} />;
};

const ArrayViewer = ({ array }: { array: unknown[] }) => {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 mb-2">Array ({array.length} items)</div>
      {array.map((item, index) => (
        <details key={index} className="border-l-2 border-gray-200 pl-2">
          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
            [{index}] {item === null ? 'null' : typeof item === 'object' ? '{...}' : String(item).slice(0, 50)}
            {typeof item !== 'object' && String(item).length > 50 && '...'}
          </summary>
          <CompositeViewer value={item} />
        </details>
      ))}
    </div>
  );
};

const ObjectViewer = ({ value }: { value: Record<string, unknown> }) => {
    return (
      <div className="space-y-1">
        {Object.keys(value).map((key) => {
          const item = value[key];
          return (
          <details key={key} className="border-l-2 border-gray-200 pl-2">
            <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
              {key}: {item === null ? 'null' : typeof item === 'object' ? '{...}' : String(item).slice(0, 50)}
              {typeof item !== 'object' && String(item).length > 50 && '...'}
            </summary>
            <CompositeViewer value={item} />
          </details>
        );})}
      </div>
    );
  };

const ToStringViewer = ({ value }: { value: unknown }) => {
  return (
  <pre className="mt-1 pl-2 text-xs font-mono bg-gray-50 rounded p-2 break-all overflow-auto">
    {value === null ? <span className="text-gray-500 italic">null</span> : String(value)}
    </pre>
  );
};

export default InspectStateViewer;
