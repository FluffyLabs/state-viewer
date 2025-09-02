export type Tabs = 'encoded' | 'decoded-tiny' | 'decoded-full' | 'trie';

export function isValidTab(tab?: string): tab is Tabs {
  return (tab === 'encoded' || tab === 'decoded-tiny' || tab === 'decoded-full' || tab === 'trie');
}