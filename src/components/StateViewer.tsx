import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Copy, Eye, X } from 'lucide-react';
import { Button } from './Button';

interface DiffEntry {
  type: 'added' | 'removed' | 'changed' | 'normal';
  oldValue?: string;
  newValue?: string;
  rawValue: string;
}

interface StateViewerProps {
  state: Record<string, string>;
  title?: string;
}

const StateViewer = ({ state, title = "State Data" }: StateViewerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    key: string;
    value: string;
    diffEntry: DiffEntry | null;
  }>({ isOpen: false, key: '', value: '', diffEntry: null });
  const topRef = useRef<HTMLDivElement>(null);

  const stateEntries = useMemo(() => Object.entries(state), [state]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return stateEntries;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return stateEntries.filter(([key, value]) =>
      key.toLowerCase().includes(lowerSearchTerm) ||
      value.toLowerCase().includes(lowerSearchTerm)
    );
  }, [stateEntries, searchTerm]);

  // Scroll to top when title changes (switching between pre-state/post-state/diff)
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [title]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const parseDiffValue = (value: string): DiffEntry => {
    if (value.startsWith('[ADDED] ')) {
      return {
        type: 'added',
        newValue: value.slice(8),
        rawValue: value
      };
    } else if (value.startsWith('[REMOVED] ')) {
      return {
        type: 'removed',
        oldValue: value.slice(10),
        rawValue: value
      };
    } else if (value.startsWith('[CHANGED] ')) {
      const changeContent = value.slice(10);
      const arrowIndex = changeContent.indexOf(' → ');
      if (arrowIndex !== -1) {
        return {
          type: 'changed',
          oldValue: changeContent.slice(0, arrowIndex),
          newValue: changeContent.slice(arrowIndex + 3),
          rawValue: value
        };
      }
    }

    return {
      type: 'normal',
      rawValue: value
    };
  };

  const formatHexValue = (hex: string) => {
    if (hex.length <= 20) return hex;
    return `${hex.slice(0, 10)}...${hex.slice(-6)}`;
  };

  const getDiffLabel = (diffType: DiffEntry['type']) => {
    switch (diffType) {
      case 'added':
        return 'Added';
      case 'removed':
        return 'Removed';
      case 'changed':
        return 'Changed';
      default:
        return 'Value';
    }
  };

  // Highlight search matches in text
  const highlightSearchMatches = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const isMatch = regex.test(part);
      regex.lastIndex = 0; // Reset regex for next test
      
      return isMatch ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-100 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  // Create inline diff visualization with grouped consecutive changes
  const createInlineDiff = (oldValue: string, newValue: string) => {
    const maxLength = Math.max(oldValue.length, newValue.length);
    const parts: Array<{ text: string; type: 'same' | 'removed' | 'added' }> = [];
    
    let i = 0;
    while (i < maxLength) {
      const oldChar = oldValue[i] || '';
      const newChar = newValue[i] || '';
      
      if (oldChar === newChar && oldChar !== '') {
        // Characters are the same - collect all consecutive same characters
        let sameText = oldChar;
        i++;
        while (i < maxLength && oldValue[i] === newValue[i] && oldValue[i]) {
          sameText += oldValue[i];
          i++;
        }
        parts.push({ text: sameText, type: 'same' });
      } else {
        // Characters are different - collect consecutive changes
        let removedText = '';
        let addedText = '';
        
        // Collect consecutive different characters
        while (i < maxLength && (oldValue[i] || '') !== (newValue[i] || '')) {
          if (oldValue[i]) removedText += oldValue[i];
          if (newValue[i]) addedText += newValue[i];
          i++;
        }
        
        // Ensure even number of characters in blocks
        const makeEvenLength = (text: string) => {
          return text.length % 2 === 0 ? text : text + ' ';
        };
        
        if (removedText) {
          parts.push({ text: makeEvenLength(removedText), type: 'removed' });
        }
        if (addedText) {
          parts.push({ text: makeEvenLength(addedText), type: 'added' });
        }
      }
    }
    
    return parts.map((part, index) => {
      const className = part.type === 'removed' 
        ? 'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100' 
        : part.type === 'added'
        ? 'bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-100'
        : '';
      
      return (
        <span key={index} className={className}>
          {part.text}
        </span>
      );
    });
  };

  if (stateEntries.length === 0) {
    return (
      <div ref={topRef} className="bg-background rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">No state data to display</p>
      </div>
    );
  }

  return (
    <div ref={topRef} className="bg-background rounded-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {stateEntries.length} entries total
          {filteredEntries.length !== stateEntries.length &&
            ` • ${filteredEntries.length} matching search`
          }
        </p>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b bg-muted/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search keys or values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
          />
        </div>
      </div>

      {/* State Entries */}
      <div className="divide-y divide-border text-left">
        {filteredEntries.length > 0 ? (
          filteredEntries.map(([key, value], index) => {
            const diffEntry = parseDiffValue(value);
            const diffLabel = getDiffLabel(diffEntry.type);

            return (
              <div key={`${key}-${index}`} className="px-6 py-3 hover:bg-muted/30">
                <div className="space-y-2">
                  {/* Key Row */}
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-16 flex-shrink-0">
                      Key
                    </label>
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <code className="text-sm font-mono text-foreground break-all bg-muted px-2 py-1 rounded flex-1">
                        {highlightSearchMatches(key, searchTerm)}
                      </code>
                      <Button
                        onClick={() => handleCopy(key, `key-${key}`)}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        aria-label="Copy key"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedKey === `key-${key}` && (
                          <span className="ml-1 text-xs">Copied!</span>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Value Row */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 flex-shrink-0 flex items-center gap-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {diffEntry.type !== 'normal' ? (
                        <span className={`px-0.5 py-0.5 rounded text-xs font-semibold ${
                          diffEntry.type === 'added' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                          diffEntry.type === 'removed' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
                        }`}>
                          {diffEntry.type.toUpperCase()}
                        </span>
                      ) : (
                      <span>
                        {diffLabel}
                      </span>
                      )}
                    </label>
                    </div>

                    <div className="flex-1 min-w-0">
                      {diffEntry.type === 'changed' ? (
                        // Show inline diff for changed entries
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono break-all bg-muted px-2 py-1 rounded border border-border text-foreground flex-1">
                            <span title={`${diffEntry.oldValue} → ${diffEntry.newValue}`}>
                              {diffEntry.oldValue && diffEntry.newValue ? (
                                createInlineDiff(
                                  diffEntry.oldValue.length > 50 ? formatHexValue(diffEntry.oldValue) : diffEntry.oldValue,
                                  diffEntry.newValue.length > 50 ? formatHexValue(diffEntry.newValue) : diffEntry.newValue
                                )
                              ) : (
                                highlightSearchMatches(formatHexValue(diffEntry.newValue || diffEntry.oldValue || value), searchTerm)
                              )}
                            </span>
                          </code>
                          <Button
                            onClick={() => setDialogState({
                              isOpen: true,
                              key,
                              value: diffEntry.newValue || diffEntry.oldValue || value,
                              diffEntry
                            })}
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            aria-label="View full value"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        // Show single value for normal, added, or removed entries
                        <div className="flex items-center space-x-2">
                          <code className={`text-sm font-mono break-all px-2 py-1 rounded border flex-1 ${
                            diffEntry.type === 'added' 
                              ? 'bg-green-100 border-green-300 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-100'
                              : diffEntry.type === 'removed'
                              ? 'bg-red-100 border-red-300 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-100'
                              : 'bg-muted border-border text-foreground'
                          }`}>
                            <span title={diffEntry.newValue || diffEntry.oldValue || value}>
                              {highlightSearchMatches(formatHexValue(diffEntry.newValue || diffEntry.oldValue || value), searchTerm)}
                            </span>
                          </code>
                          <Button
                            onClick={() => setDialogState({
                              isOpen: true,
                              key,
                              value: diffEntry.newValue || diffEntry.oldValue || value,
                              diffEntry
                            })}
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            aria-label="View full value"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-muted-foreground">No entries match your search</p>
          </div>
        )}
      </div>

      {/* Value Dialog */}
      {dialogState.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {dialogState.diffEntry?.type === 'changed' ? 'Value Diff' : 'Full Value'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Key: {dialogState.key} • Size: {Math.floor(dialogState.value.replace('0x', '').length / 2)} bytes
                </p>
              </div>
              <button
                onClick={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted/10 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 overflow-auto flex-1">
              {dialogState.diffEntry?.type === 'changed' ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Before:</h4>
                    <code className="block text-sm font-mono break-all bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-700 text-red-900 dark:text-red-100">
                      {dialogState.diffEntry.oldValue}
                    </code>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">After:</h4>
                    <code className="block text-sm font-mono break-all bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-700 text-green-900 dark:text-green-100">
                      {dialogState.diffEntry.newValue}
                    </code>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Inline Diff:</h4>
                    <code className="block text-sm font-mono break-all bg-muted p-3 rounded border border-border text-foreground">
                      {dialogState.diffEntry.oldValue && dialogState.diffEntry.newValue && 
                        createInlineDiff(dialogState.diffEntry.oldValue, dialogState.diffEntry.newValue)
                      }
                    </code>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {dialogState.diffEntry?.type === 'added' ? 'Added Value:' :
                     dialogState.diffEntry?.type === 'removed' ? 'Removed Value:' : 'Value:'}
                  </h4>
                  <code className={`block text-sm font-mono break-all p-3 rounded border ${
                    dialogState.diffEntry?.type === 'added' 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-900 dark:text-green-100'
                      : dialogState.diffEntry?.type === 'removed'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-900 dark:text-red-100'
                      : 'bg-muted border-border text-foreground'
                  }`}>
                    {dialogState.value}
                  </code>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="p-6 border-t border-border">
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
                  variant="secondary"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const textToCopy = dialogState.diffEntry?.type === 'changed' 
                      ? `Before: ${dialogState.diffEntry.oldValue}\nAfter: ${dialogState.diffEntry.newValue}`
                      : dialogState.value;
                    handleCopy(textToCopy, 'dialog');
                  }}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copiedKey === 'dialog' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StateViewer;
