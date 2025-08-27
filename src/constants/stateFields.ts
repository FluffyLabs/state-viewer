import { StateCodec, serialize as stateSerialize } from "@typeberry/state-merkleization";

export interface StateField {
  key: string;
  notation: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize: StateCodec<any>;
}

export const STATE_FIELDS: StateField[] = [
  {
    key: 'availabilityAssignment',
    notation: 'ρ',
    title: 'rho',
    description: 'Work-reports which have been reported but are not yet known to be available to a super-majority of validators',
    serialize: stateSerialize.availabilityAssignment
  },
  {
    key: 'designatedValidatorData',
    notation: 'ι',
    title: 'iota',
    description: 'The validator keys and metadata to be drawn from next',
    serialize: stateSerialize.designatedValidators
  },
  {
    key: 'nextValidatorData',
    notation: 'γₖ',
    title: 'gamma_k',
    description: 'The keys for the validators of the next epoch',
    serialize: stateSerialize.safrole
  },
  {
    key: 'currentValidatorData',
    notation: 'κ',
    title: 'kappa',
    description: 'Current validators, who are the set of economic actors uniquely privileged to help build and maintain the Jam chain',
    serialize: stateSerialize.currentValidators
  },
  {
    key: 'previousValidatorData',
    notation: 'λ',
    title: 'lambda',
    description: 'Previous validators data archived from past epochs',
    serialize: stateSerialize.previousValidators
  },
  {
    key: 'disputesRecords',
    notation: 'ψ',
    title: 'psi',
    description: 'Judgements',
    serialize: stateSerialize.disputesRecords
  },
  {
    key: 'timeslot',
    notation: 'τ',
    title: 'tau',
    description: 'The current time slot',
    serialize: stateSerialize.timeslot
  },
  {
    key: 'entropy',
    notation: 'η',
    title: 'eta',
    description: 'An on-chain entropy pool',
    serialize: stateSerialize.entropy
  },
  {
    key: 'authPools',
    notation: 'α',
    title: 'alpha',
    description: 'Authorizers available for each core (authorizer pool)',
    serialize: stateSerialize.authPools
  },
  {
    key: 'authQueues',
    notation: 'φ',
    title: 'phi',
    description: 'A queue of authorizers for each core used to fill up the pool',
    serialize: stateSerialize.authQueues
  },
  {
    key: 'recentBlocks',
    notation: 'β',
    title: 'beta',
    description: 'State of the blocks from recent history',
    serialize: stateSerialize.recentBlocks
  },
  {
    key: 'statistics',
    notation: 'π',
    title: 'pi',
    description: 'Previous and current statistics of each validator, cores statistics and services statistics',
    serialize: stateSerialize.statistics
  },
  {
    key: 'accumulationQueue',
    notation: 'Ω',
    title: 'omega',
    description: 'Ready but not-yet-accumulated work-reports',
    serialize: stateSerialize.accumulationQueue
  },
  {
    key: 'recentlyAccumulated',
    notation: 'ξ',
    title: 'xi',
    description: 'History of what has been accumulated',
    serialize: stateSerialize.recentlyAccumulated
  },
  {
    key: 'accumulationOutputLog',
    notation: 'θ',
    title: 'theta',
    description: 'Services accumulation output',
    serialize: stateSerialize.accumulationOutputLog,
  },
  {
    key: 'ticketsAccumulator',
    notation: 'γₐ',
    title: 'gamma_a',
    description: 'The ticket accumulator - a series of highest-scoring ticket identifiers for the next epoch',
    serialize: stateSerialize.safrole
  },
  {
    key: 'sealingKeySeries',
    notation: 'γₛ',
    title: 'gamma_s',
    description: 'Current epoch\'s slot-sealer series',
    serialize: stateSerialize.safrole
  },
  {
    key: 'epochRoot',
    notation: 'γᵤ',
    title: 'gamma_z',
    description: 'The epoch\'s root, a Bandersnatch ring root composed with the one Bandersnatch key of each of the next epoch\'s validators',
    serialize: stateSerialize.safrole
  },
  {
    key: 'privilegedServices',
    notation: 'χ',
    title: 'chi',
    description: 'Up to three services recognized as privileged',
    serialize: stateSerialize.privilegedServices
  },
];

/**
 * Create a mapping from raw keys to state field information
 */
export const createRawKeyToFieldMap = (): Map<string, StateField> => {
  const map = new Map<string, StateField>();

  STATE_FIELDS.forEach(field => {
    const rawKey = field.serialize.key?.toString();
    if (rawKey) {
      map.set(rawKey, field);
      // Also add the key without the last two characters (for compatibility)
      if (rawKey.length > 2) {
        map.set(rawKey.substring(0, rawKey.length - 2), field);
      }
    }
  });

  return map;
};

/**
 * Create a mapping from field names to raw keys
 */
export const createFieldToRawKeyMap = (): Map<string, string> => {
  const map = new Map<string, string>();

  STATE_FIELDS.forEach(field => {
    const rawKey = field.serialize.key?.toString();
    if (rawKey) {
      map.set(field.key.toLowerCase(), rawKey);
      map.set(field.title.toLowerCase(), rawKey);
      map.set(field.notation.toLowerCase(), rawKey);
    }
  });

  return map;
};
