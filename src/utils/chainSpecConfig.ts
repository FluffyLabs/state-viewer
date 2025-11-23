import { config } from '@typeberry/lib';

export type ChainSpecType = 'tiny' | 'full';

const CHAIN_SPEC_KEY = 'CHAIN_SPEC';
const DEFAULT_CHAIN_SPEC: ChainSpecType = 'tiny';

export function getChainSpecType(): ChainSpecType {
  const stored = window.sessionStorage.getItem(CHAIN_SPEC_KEY);
  if (stored === 'tiny' || stored === 'full') {
    return stored;
  }
  return DEFAULT_CHAIN_SPEC;
}

export function getChainSpec() {
  const specType = getChainSpecType();
  return specType === 'tiny' ? config.tinyChainSpec : config.fullChainSpec;
}
