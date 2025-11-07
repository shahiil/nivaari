'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, X } from 'lucide-react';

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  type?: string;
}

interface DockSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}

export default function DockSearchBar({ isOpen, onClose, onLocationSelect }: DockSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when closed
      setSearchQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '8',
          countrycodes: 'in',
        }),
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onLocationSelect(lat, lng, result.display_name);
    onClose();
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - click to close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[65]"
        onClick={onClose}
      />

      {/* Search Bar Container */}
      <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-[75] w-full max-w-2xl px-4 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Suggestions Panel - appears above search bar */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mb-3 bg-black/60 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-[0_0_40px_rgba(0,183,255,0.4)] overflow-hidden max-h-[400px] overflow-y-auto"
              >
                <div className="p-2">
                  {results.map((result, index) => (
                    <motion.button
                      key={result.place_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      onClick={() => handleSelectLocation(result)}
                      className="w-full flex items-start gap-3 p-3 hover:bg-cyan-400/10 rounded-xl transition-all duration-200 text-left group"
                    >
                      <div className="p-2 bg-cyan-400/10 rounded-lg group-hover:bg-cyan-400/20 transition-colors flex-shrink-0">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate text-sm">
                          {result.display_name.split(',').slice(0, 2).join(',')}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {result.display_name}
                        </p>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded font-medium">
                          Go →
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="relative bg-black/60 backdrop-blur-xl border-2 border-cyan-400/40 rounded-2xl shadow-[0_0_50px_rgba(0,183,255,0.5)] overflow-hidden">
              {/* Glowing effect on border */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 animate-pulse pointer-events-none" />
              
              <div className="relative flex items-center gap-3 px-5 py-4">
                {/* Search Icon */}
                <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                
                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for cities, landmarks, addresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder:text-gray-400 outline-none text-base"
                />
                
                {/* Loading or Clear Button */}
                <div className="flex-shrink-0">
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  ) : searchQuery.length > 0 ? (
                    <button
                      onClick={handleClear}
                      className="p-1 hover:bg-cyan-400/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Hint text */}
              {searchQuery.length > 0 && searchQuery.length < 3 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-3 pt-0"
                >
                  <p className="text-xs text-gray-500">
                    Type at least 3 characters to search
                  </p>
                </motion.div>
              )}

              {/* No results message */}
              {hasSearched && !isSearching && results.length === 0 && searchQuery.length >= 3 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-3 pt-0"
                >
                  <p className="text-xs text-gray-500">
                    No locations found. Try a different search term.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Helper text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-gray-500 text-center mt-2"
            >
              Press <span className="text-cyan-400 font-medium">ESC</span> to close • Click outside to dismiss
            </motion.p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
