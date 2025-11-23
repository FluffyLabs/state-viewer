export type Tabs = 'encoded' | 'decoded' | 'trie';

export function isValidTab(tab?: string): tab is Tabs {
  return (tab === 'encoded' || tab === 'decoded' || tab === 'trie');
}
