import React, { useState } from 'react';
import { Search, Download, FileDiff, CheckCircle, AlertTriangle } from 'lucide-react';

interface FirmwareExplorerProps {
  currentFileMetadata: any;
  onCompare: (firmwareUrl: string) => void;
}

export default function FirmwareExplorer({ currentFileMetadata, onCompare }: FirmwareExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/firmware-search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError('Failed to fetch firmware data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-indigo-400" />
        Firmware Explorer
      </h2>
      
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search firmware (e.g., Bosch EDC17C46 .ori)"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {searchResults && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <h3 className="text-sm font-medium text-zinc-300 mb-2">AI Summary</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{searchResults.summary}</p>
          </div>

          {searchResults.links && searchResults.links.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Found Sources</h3>
              <ul className="space-y-2">
                {searchResults.links.map((link: any, index: number) => (
                  <li key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm text-zinc-200 truncate">{link.title || new URL(link.uri).hostname}</span>
                      <a href={link.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline truncate">
                        {link.uri}
                      </a>
                    </div>
                    <button
                      onClick={() => onCompare(link.uri)}
                      className="ml-4 shrink-0 flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium rounded-md transition-colors"
                    >
                      <FileDiff className="w-3.5 h-3.5" />
                      Compare
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {(!searchResults.links || searchResults.links.length === 0) && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No direct download links found. Try refining your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
