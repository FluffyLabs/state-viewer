import { useState, useMemo } from 'react';
import { Search, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const itemsPerPage = 10;

  const stateEntries = useMemo(() => Object.entries(state), [state]);
  
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return stateEntries;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return stateEntries.filter(([key, value]) => 
      key.toLowerCase().includes(lowerSearchTerm) || 
      value.toLowerCase().includes(lowerSearchTerm)
    );
  }, [stateEntries, searchTerm]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

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

  const getDiffStyling = (diffType: DiffEntry['type']) => {
    switch (diffType) {
      case 'added':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'removed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'changed':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-foreground';
    }
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  // Reset page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (stateEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">No state data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {stateEntries.length} entries total
          {filteredEntries.length !== stateEntries.length && 
            ` • ${filteredEntries.length} matching search`
          }
        </p>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search keys or values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* State Entries */}
      <div className="divide-y">
        {currentEntries.length > 0 ? (
          currentEntries.map(([key, value], index) => {
            const diffEntry = parseDiffValue(value);
            const diffStyling = getDiffStyling(diffEntry.type);
            const diffLabel = getDiffLabel(diffEntry.type);
            
            return (
              <div key={`${key}-${index}`} className="px-6 py-4 hover:bg-gray-50">
                <div className="space-y-3">
                  {/* Key */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Key
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <code className="text-sm font-mono text-foreground break-all bg-gray-100 px-2 py-1 rounded">
                          {key}
                        </code>
                        <Button
                          onClick={() => handleCopy(key, `key-${key}`)}
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                          aria-label="Copy key"
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy</span>
                          {copiedKey === `key-${key}` && (
                            <span className="ml-1 text-xs">Copied!</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {diffLabel}
                        {diffEntry.type !== 'normal' && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                            diffEntry.type === 'added' ? 'bg-green-100 text-green-800' :
                            diffEntry.type === 'removed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {diffEntry.type.toUpperCase()}
                          </span>
                        )}
                      </label>
                      
                      {diffEntry.type === 'changed' ? (
                        // Show old and new values for changed entries
                        <div className="mt-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-red-600 font-medium">Before:</span>
                            <code className="text-sm font-mono break-all bg-red-50 px-2 py-1 rounded border border-red-200 text-red-800">
                              <span title={diffEntry.oldValue}>
                                {formatHexValue(diffEntry.oldValue || '')}
                              </span>
                            </code>
                            <Button
                              onClick={() => handleCopy(diffEntry.oldValue || '', `old-${key}`)}
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0"
                              aria-label="Copy old value"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-green-600 font-medium">After:</span>
                            <code className="text-sm font-mono break-all bg-green-50 px-2 py-1 rounded border border-green-200 text-green-800">
                              <span title={diffEntry.newValue}>
                                {formatHexValue(diffEntry.newValue || '')}
                              </span>
                            </code>
                            <Button
                              onClick={() => handleCopy(diffEntry.newValue || '', `new-${key}`)}
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0"
                              aria-label="Copy new value"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Show single value for normal, added, or removed entries
                        <div className="mt-1 flex items-center space-x-2">
                          <code className={`text-sm font-mono break-all px-2 py-1 rounded border ${diffStyling}`}>
                            <span title={diffEntry.newValue || diffEntry.oldValue || value}>
                              {formatHexValue(diffEntry.newValue || diffEntry.oldValue || value)}
                            </span>
                          </code>
                          <Button
                            onClick={() => handleCopy(diffEntry.newValue || diffEntry.oldValue || value, `value-${key}`)}
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            aria-label="Copy value"
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                            {copiedKey === `value-${key}` && (
                              <span className="ml-1 text-xs">Copied!</span>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {((diffEntry.newValue || diffEntry.oldValue || value).length > 20) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Length: {(diffEntry.newValue || diffEntry.oldValue || value).length} characters
                        </p>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEntries.length)} of {filteredEntries.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="ghost"
              size="sm"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="ghost"
              size="sm"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StateViewer;