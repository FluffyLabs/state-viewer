import { state_merkleization as lib } from "@typeberry/lib";

export interface StateField {
  key: string;
  notation: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize: lib.StateCodec<any>;
  gpLink: string,
  serializeName: string,
}

const safroleLink = 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3ba1013ba101?v=0.7.2';
export const STATE_FIELDS: StateField[] = [
  {
    key: 'availabilityAssignment',
    notation: 'ρ',
    title: 'rho',
    description: 'Work-reports which have been reported but are not yet known to be available to a super-majority of validators',
    serialize: lib.serialize.availabilityAssignment,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b7d023b7d02?v=0.7.2',
    serializeName: 'C10',
  },
  {
    key: 'designatedValidatorData',
    notation: 'ι',
    title: 'iota',
    description: 'The validator keys and metadata to be drawn from next',
    serialize: lib.serialize.designatedValidators,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b4a023b4a02?v=0.7.2',
    serializeName: 'C7',
  },
  {
    key: 'nextValidatorData',
    notation: 'γₖ',
    title: 'gamma_k',
    description: 'The keys for the validators of the next epoch',
    serialize: lib.serialize.safrole,
    gpLink: safroleLink,
    serializeName: 'C4',
  },
  {
    key: 'currentValidatorData',
    notation: 'κ',
    title: 'kappa',
    description: 'Current validators, who are the set of economic actors uniquely privileged to help build and maintain the Jam chain',
    serialize: lib.serialize.currentValidators,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b5b023b5b02?v=0.7.2',
    serializeName: 'C8',
  },
  {
    key: 'previousValidatorData',
    notation: 'λ',
    title: 'lambda',
    description: 'Previous validators data archived from past epochs',
    serialize: lib.serialize.previousValidators,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b6c023b6c02?v=0.7.2',
    serializeName: 'C9',
  },
  {
    key: 'disputesRecords',
    notation: 'ψ',
    title: 'psi',
    description: 'Judgements',
    serialize: lib.serialize.disputesRecords,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3bfc013bfc01?v=0.7.2',
    serializeName: 'C5',
  },
  {
    key: 'timeslot',
    notation: 'τ',
    title: 'tau',
    description: 'The current time slot',
    serialize: lib.serialize.timeslot,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3ba9023ba902?v=0.7.2',
    serializeName: 'C11',
  },
  {
    key: 'entropy',
    notation: 'η',
    title: 'eta',
    description: 'An on-chain entropy pool',
    serialize: lib.serialize.entropy,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b39023b3902?v=0.7.2',
    serializeName: 'C6',
  },
  {
    key: 'authPools',
    notation: 'α',
    title: 'alpha',
    description: 'Authorizers available for each core (authorizer pool)',
    serialize: lib.serialize.authPools,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b39013b3901?v=0.7.2',
    serializeName: 'C1',
  },
  {
    key: 'authQueues',
    notation: 'φ',
    title: 'phi',
    description: 'A queue of authorizers for each core used to fill up the pool',
    serialize: lib.serialize.authQueues,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b5e013b5e01?v=0.7.2',
    serializeName: 'C2',
  },
  {
    key: 'recentBlocks',
    notation: 'β',
    title: 'beta',
    description: 'State of the blocks from recent history',
    serialize: lib.serialize.recentBlocks,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b6f013b6f01?v=0.7.2',
    serializeName: 'C3',
  },
  {
    key: 'statistics',
    notation: 'π',
    title: 'pi',
    description: 'Previous and current statistics of each validator, cores statistics and services statistics',
    serialize: lib.serialize.statistics,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3bd6023bd602?v=0.7.2',
    serializeName: 'C13',
  },
  {
    key: 'accumulationQueue',
    notation: 'Ω',
    title: 'omega',
    description: 'Ready but not-yet-accumulated work-reports',
    serialize: lib.serialize.accumulationQueue,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3bf0023bf002?v=0.7.2',
    serializeName: 'C14',
  },
  {
    key: 'recentlyAccumulated',
    notation: 'ξ',
    title: 'xi',
    description: 'History of what has been accumulated',
    serialize: lib.serialize.recentlyAccumulated,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b27033b2703?v=0.7.2',
    serializeName: 'C15',
  },
  {
    key: 'accumulationOutputLog',
    notation: 'θ',
    title: 'theta',
    description: 'Services accumulation output',
    serialize: lib.serialize.accumulationOutputLog,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3b47033b4703?v=0.7.2',
    serializeName: 'C16',
  },
  {
    key: 'ticketsAccumulator',
    notation: 'γₐ',
    title: 'gamma_a',
    description: 'The ticket accumulator - a series of highest-scoring ticket identifiers for the next epoch',
    serialize: lib.serialize.safrole,
    gpLink: safroleLink,
    serializeName: 'C4',
  },
  {
    key: 'sealingKeySeries',
    notation: 'γₛ',
    title: 'gamma_s',
    description: 'Current epoch\'s slot-sealer series',
    serialize: lib.serialize.safrole,
    gpLink: safroleLink,
    serializeName: 'C4',
  },
  {
    key: 'epochRoot',
    notation: 'γᵤ',
    title: 'gamma_z',
    description: 'The epoch\'s root, a Bandersnatch ring root composed with the one Bandersnatch key of each of the next epoch\'s validators',
    serialize: lib.serialize.safrole,
    gpLink: safroleLink,
    serializeName: 'C4',
  },
  {
    key: 'privilegedServices',
    notation: 'χ',
    title: 'chi',
    description: 'Up to three services recognized as privileged',
    serialize: lib.serialize.privilegedServices,
    gpLink: 'https://graypaper.fluffylabs.dev/#/ab2cdbd/3bbb023bbb02?v=0.7.2',
    serializeName: 'C12',
  },
];

/**
 * Create a mapping from raw keys to state field information
 */
export const createRawKeyToFieldMap = (): Map<string, StateField> => {
  const map = new Map<string, StateField>();

  STATE_FIELDS.forEach(field => {
    const rawKey = field.serialize?.key?.toString();
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
