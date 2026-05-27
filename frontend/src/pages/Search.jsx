import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Film, User, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function Search({ page, setPage, setSelectedMovieId, searchQuery, setSearchQuery }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchResults = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      if (response.data?.success) {
        setResults(response.data.data.results || []);
      } else {
        setError(response.data?.error || 'Failed to get search results.');
        setResults([]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error connecting to the search service.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search if searchQuery prop changes (e.g. from Home page redirect)
  useEffect(() => {
    if (searchQuery) {
      fetchResults(searchQuery);
    }
  }, [searchQuery]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchResults(searchQuery);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Search Input Container */}
      <div className="max-w-2xl mx-auto space-y-2 text-left">
        <h1 className="text-3xl font-extrabold text-white">Search Content</h1>
        <p className="text-brand-muted text-sm">Find movies, TV series, actors, and directors from IMDb suggestion service.</p>
        
        <form onSubmit={handleFormSubmit} className="relative group pt-4">
          <input 
            type="text"
            placeholder="Type your query (e.g., Batman, Nolan)..."
            value={searchQuery}
            onChange={handleInputChange}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-brand-card/90 backdrop-blur border border-brand-border focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent text-white font-medium shadow-xl transition-all duration-300 group-hover:border-white/10"
          />
          <SearchIcon className="absolute left-5 top-[58%] transform -translate-y-1/2 w-6 h-6 text-brand-muted group-focus-within:text-brand-accent transition-colors" />
          <button 
            type="submit"
            className="absolute right-3 top-[58%] transform -translate-y-1/2 px-5 py-2 bg-brand-accent hover:bg-brand-accentHover text-white text-xs font-bold rounded-xl transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="max-w-md mx-auto p-4 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center gap-3 text-brand-accent text-left text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-64 rounded-2xl skeleton" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {results.length > 0 && (
            <p className="text-left text-brand-muted text-sm font-medium">
              Found {results.length} suggestions for "{searchQuery}"
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <AnimatePresence>
              {results.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  onClick={() => {
                    if (item.type === 'Title') {
                      setSelectedMovieId(item.id);
                      setPage('movie-details');
                    } else if (item.type === 'Person') {
                      setSearchQuery(item.name);
                      setPage('people');
                    }
                  }}
                  className="group cursor-pointer rounded-2xl overflow-hidden glass border border-brand-border hover:border-brand-accent/30 transition-all duration-300 flex flex-col hover:scale-[1.03]"
                >
                  <div className="aspect-[3/4] w-full bg-brand-dark overflow-hidden relative">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-brand-muted gap-2">
                        {item.type === 'Title' ? <Film className="w-12 h-12 stroke-[1.5]" /> : <User className="w-12 h-12 stroke-[1.5]" />}
                        <span className="text-xs uppercase font-bold tracking-wider">{item.type}</span>
                      </div>
                    )}
                    
                    {/* Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                        item.type === 'Title' 
                          ? 'bg-brand-accent/90 text-white' 
                          : 'bg-brand-gold/90 text-black'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 text-left flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-white text-sm group-hover:text-brand-accent transition line-clamp-2">
                        {item.name}
                      </h3>
                      {item.year && (
                        <span className="text-[10px] font-semibold text-brand-muted bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {item.year}
                        </span>
                      )}
                      {item.description && (
                        <p className="text-xs text-brand-muted line-clamp-2 pt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-brand-border mt-3 text-[10px] text-brand-muted flex justify-between items-center">
                      <span>ID: {item.id}</span>
                      {item.rank && <span>Rank: {item.rank}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!loading && results.length === 0 && searchQuery && (
            <div className="text-center py-16 space-y-4">
              <Film className="w-16 h-16 text-brand-muted mx-auto stroke-[1.2]" />
              <p className="text-lg text-brand-muted font-medium">No results found for "{searchQuery}"</p>
              <p className="text-sm text-brand-muted max-w-sm mx-auto">Try typing another query or checking your spelling.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
