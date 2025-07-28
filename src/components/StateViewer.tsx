import { useState, useMemo } from 'react';
import { Search, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

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

  const formatHexValue = (hex: string) => {
    if (hex.length <= 20) return hex;
    return `${hex.slice(0, 10)}...${hex.slice(-6)}`;
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
          currentEntries.map(([key, value], index) => (
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
                      Value
                    </label>
                    <div className="mt-1 flex items-center space-x-2">
                      <code className="text-sm font-mono text-foreground break-all bg-blue-50 px-2 py-1 rounded border">
                        <span title={value}>
                          {formatHexValue(value)}
                        </span>
                      </code>
                      <Button
                        onClick={() => handleCopy(value, `value-${key}`)}
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
                    {value.length > 20 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Length: {value.length} characters
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
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