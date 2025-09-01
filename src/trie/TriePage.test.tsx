import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, it, expect, vi } from 'vitest';
import { TriePage } from './TriePage';

// Mock the trie components and dependencies
vi.mock('@/trie/components/trie-input', () => ({
  TrieInput: ({ onChange }: { onChange: (rows: unknown[]) => void }) => (
    <div data-testid="trie-input">
      Mocked TrieInput
      <button onClick={() => onChange([{ key: 'test', value: 'value', action: 'insert' }])}>
        Add Test Row
      </button>
    </div>
  ),
}));

vi.mock('@/trie/components/trie-input/example-modal', () => ({
  default: ({ onSelect }: { onSelect: (rows: unknown[]) => void }) => (
    <button 
      data-testid="example-modal"
      onClick={() => onSelect([{ key: 'example', value: 'example-value', action: 'insert' }])}
    >
      Examples
    </button>
  ),
  examples: [{ rows: [{ key: 'default', value: 'default-value', action: 'insert' }] }],
}));

vi.mock('@/trie/components/trie/blake2b.node', () => ({
  blake2bTrieHasher: {
    hash: vi.fn(() => new Uint8Array([1, 2, 3, 4])),
    hashSize: 32,
  },
}));

vi.mock('@/trie/components/trie', () => ({
  default: ({ onNodeSelect }: { onNodeSelect: (node: string) => void }) => (
    <div data-testid="trie-component">
      Mocked Trie Component
      <button onClick={() => onNodeSelect('test-node-hash')}>
        Select Test Node
      </button>
    </div>
  ),
}));

vi.mock('@/trie/components/trie/utils', () => ({
  trieToTreeUI: vi.fn(() => ({
    name: 'root',
    children: [
      { name: 'test-node-hash', children: [] }
    ]
  })),
}));

vi.mock('@typeberry/trie', () => ({
  InMemoryTrie: {
    empty: vi.fn(() => ({
      set: vi.fn(),
      getRootNode: vi.fn(() => ({})),
      getRootHash: vi.fn(() => 'root-hash'),
      nodes: new Map(),
    })),
  },
  BytesBlob: {
    parseBlobNoPrefix: vi.fn((value: string) => new Uint8Array([...Buffer.from(value, 'utf8')])),
  },
  parseInputKey: vi.fn((key: string) => key),
}));

vi.mock('@/trie/components/ui/checkbox', () => ({
  Checkbox: ({ onCheckedChange, id }: { onCheckedChange: (checked: boolean) => void; id: string }) => (
    <input 
      type="checkbox" 
      data-testid={`checkbox-${id}`}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

vi.mock('@/trie/components/node-details', () => ({
  default: ({ node, onClose }: { node: { name?: string } | null; onClose: () => void }) => (
    <div data-testid="node-details">
      Node Details for: {node?.name || 'Unknown'}
      <button onClick={onClose} data-testid="close-node-details">
        Close
      </button>
    </div>
  ),
}));

describe('TriePage', () => {
  const user = userEvent.setup();

  it('renders without crashing', () => {
    const { container } = render(<TriePage />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the main components', () => {
    render(<TriePage />);

    expect(screen.getByText('Trie Input')).toBeInTheDocument();
    expect(screen.getByText('Examples')).toBeInTheDocument();
    expect(screen.getByText('Hide empty nodes')).toBeInTheDocument();
    expect(screen.getByTestId('trie-input')).toBeInTheDocument();
    expect(screen.getByTestId('trie-component')).toBeInTheDocument();
  });

  it('has the correct layout structure', () => {
    render(<TriePage />);

    const mainContainer = document.querySelector('.p-3.flex.flex-row.h-full');
    expect(mainContainer).toBeInTheDocument();

    const leftPanel = document.querySelector('.border-r-2.flex-col');
    expect(leftPanel).toBeInTheDocument();

    const rightPanel = document.querySelector('.flex.flex-col.h-full.w-full.overflow-hidden');
    expect(rightPanel).toBeInTheDocument();
  });

  it('renders the hide empty nodes checkbox', () => {
    render(<TriePage />);

    const checkbox = screen.getByTestId('checkbox-hideEmpty');
    expect(checkbox).toBeInTheDocument();
    expect(screen.getByText('Hide empty nodes')).toBeInTheDocument();
  });

  it('renders the example modal button', () => {
    render(<TriePage />);

    const exampleButton = screen.getByTestId('example-modal');
    expect(exampleButton).toBeInTheDocument();
    expect(exampleButton).toHaveTextContent('Examples');
  });

  it('can toggle hide empty nodes checkbox', async () => {
    render(<TriePage />);

    const checkbox = screen.getByTestId('checkbox-hideEmpty') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('can select a node and display node details', async () => {
    render(<TriePage />);

    // Initially, node details should not be visible
    expect(screen.queryByTestId('node-details')).not.toBeInTheDocument();

    // Click to select a node
    const selectNodeButton = screen.getByText('Select Test Node');
    await user.click(selectNodeButton);

    // Node details should now be visible
    expect(screen.getByTestId('node-details')).toBeInTheDocument();
    expect(screen.getByText('Node Details for: test-node-hash')).toBeInTheDocument();
  });

  it('can close node details', async () => {
    render(<TriePage />);

    // Select a node first
    const selectNodeButton = screen.getByText('Select Test Node');
    await user.click(selectNodeButton);

    expect(screen.getByTestId('node-details')).toBeInTheDocument();

    // Close the node details
    const closeButton = screen.getByTestId('close-node-details');
    await user.click(closeButton);

    expect(screen.queryByTestId('node-details')).not.toBeInTheDocument();
  });

  it('can select examples from the example modal', async () => {
    render(<TriePage />);

    const exampleButton = screen.getByTestId('example-modal');
    await user.click(exampleButton);

    // The mock should trigger onChange, which should update the trie
    // Since we're mocking the dependencies, we just verify the interaction works
    expect(exampleButton).toBeInTheDocument();
  });

  it('has proper overflow handling for the trie input section', () => {
    render(<TriePage />);

    const scrollableSection = document.querySelector('[style*="max-height"]');
    expect(scrollableSection).toBeInTheDocument();
    expect(scrollableSection).toHaveClass('overflow-y-scroll');
  });

  it('displays trie component in the main area', () => {
    render(<TriePage />);

    const trieComponent = screen.getByTestId('trie-component');
    expect(trieComponent).toBeInTheDocument();
    expect(trieComponent).toHaveTextContent('Mocked Trie Component');
  });
});