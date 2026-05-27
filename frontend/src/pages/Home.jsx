import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Play, Star, Users, ArrowRight, Flame, Sparkles, Film } from 'lucide-react';
import api from '../utils/api';

const POPULAR_ACTORS_MOCK = [
  { name: 'Leonardo DiCaprio', id: 'nm0000138', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&q=80', role: 'Actor' },
  { name: 'Scarlett Johansson', id: 'nm0424060', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&q=80', role: 'Actress' },
  { name: 'Cillian Murphy', id: 'nm0614165', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&q=80', role: 'Actor' },
  { name: 'Margot Robbie', id: 'nm3053338', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&fit=crop&q=80', role: 'Actress' },
];

export default function Home({ setPage, setSelectedMovieId, setSearchQuery }) {
  const [globalTrending, setGlobalTrending] = useState([]);
  const [bollywoodTrending, setBollywoodTrending] = useState([]);
  const [southTrending, setSouthTrending] = useState([]);
  const [hollywoodTrending, setHollywoodTrending] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllTrending() {
      try {
        const [globalRes, bollywoodRes, southRes, hollywoodRes] = await Promise.all([
          api.get('/trending?count=6&region=global'),
          api.get('/trending?count=6&region=bollywood'),
          api.get('/trending?count=6&region=south_indian'),
          api.get('/trending?count=6&region=hollywood')
        ]);
        
        if (globalRes.data?.success) setGlobalTrending(globalRes.data.data);
        if (bollywoodRes.data?.success) setBollywoodTrending(bollywoodRes.data.data);
        if (southRes.data?.success) setSouthTrending(southRes.data.data);
        if (hollywoodRes.data?.success) setHollywoodTrending(hollywoodRes.data.data);
      } catch (err) {
        console.error('Error fetching trending data: ', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllTrending();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput);
      setPage('search');
    }
  };

  const renderTrendingRow = (title, data, icon) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {icon} {title}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="aspect-[2/3] rounded-2xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {data.map((movie, idx) => (
              <motion.div 
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => {
                  setSelectedMovieId(movie.id);
                  setPage('movie-details');
                }}
                className="group relative cursor-pointer rounded-2xl overflow-hidden glass border border-brand-border transition-all duration-300 hover:scale-[1.03] hover:border-brand-accent/40"
              >
                <div className="aspect-[2/3] w-full overflow-hidden relative bg-brand-dark">
                  {movie.poster_url ? (
                    <img 
                      src={movie.poster_url} 
                      alt={movie.title} 
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-white/[0.02]">
                      <Film className="w-8 h-8 text-brand-muted mb-2" />
                      <span className="text-[10px] font-semibold text-gray-400 line-clamp-2">{movie.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white text-xs font-bold bg-brand-accent px-2 py-1 rounded">
                      ⭐ {movie.rating || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="p-3 text-left">
                  <h3 className="font-semibold text-white text-xs truncate group-hover:text-brand-accent transition">
                    {movie.title}
                  </h3>
                  <p className="text-[10px] text-brand-muted mt-0.5">
                    {movie.release_year || 'Unknown Year'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const featuredMovie = globalTrending[0];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Banner Section */}
      <div className="relative h-[480px] w-full rounded-3xl overflow-hidden glass">
        {featuredMovie ? (
          <div className="absolute inset-0">
            <img 
              src={featuredMovie.poster_url} 
              alt={featuredMovie.title} 
              className="w-full h-full object-cover object-top filter brightness-[0.4]"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 skeleton brightness-[0.2]" />
        )}

        <div className="absolute bottom-0 left-0 p-8 md:p-12 space-y-6 max-w-2xl text-left">
          {featuredMovie && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-gold bg-brand-gold/10 border border-brand-gold/20 rounded-full">
                Trending #1
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans leading-tight">
                {featuredMovie.title}
              </h1>
              <p className="text-gray-300 text-sm md:text-base line-clamp-3 leading-relaxed">
                {featuredMovie.plot || "No synopsis available."}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => {
                    setSelectedMovieId(featuredMovie.id);
                    setPage('movie-details');
                  }}
                  className="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-brand-accent hover:bg-brand-accentHover rounded-xl transition duration-300 transform hover:scale-[1.03]"
                >
                  <Play className="w-5 h-5 fill-current" /> Details
                </button>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur rounded-xl border border-white/10">
                  <Star className="w-5 h-5 text-brand-gold fill-current" />
                  <span className="font-semibold text-white">{featuredMovie.rating || 'N/A'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="max-w-2xl mx-auto px-4">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <input 
            type="text"
            placeholder="Search movies, TV shows, and actors..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-brand-card/90 backdrop-blur border border-brand-border focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent text-white font-medium shadow-xl transition-all duration-300 group-hover:border-white/10"
          />
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-brand-muted group-focus-within:text-brand-accent transition-colors" />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-brand-card hover:bg-brand-border text-white text-xs font-semibold rounded-lg border border-brand-border transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Global Trending Section */}
      {renderTrendingRow("Global Trending", globalTrending, <TrendingUp className="w-6 h-6 text-brand-accent" />)}

      {/* Bollywood Trending Section */}
      {renderTrendingRow("Bollywood Trending", bollywoodTrending, <Sparkles className="w-6 h-6 text-brand-gold" />)}

      {/* South Indian Blockbusters Section */}
      {renderTrendingRow("South Indian Blockbusters", southTrending, <Flame className="w-6 h-6 text-orange-500" />)}

      {/* Hollywood Hits Section */}
      {renderTrendingRow("Hollywood Hits", hollywoodTrending, <Film className="w-6 h-6 text-cyan-400" />)}

      {/* Popular Celebs Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-gold" /> Popular Actors
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {POPULAR_ACTORS_MOCK.map((actor, idx) => (
            <motion.div
              key={actor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              onClick={() => {
                setSearchQuery(actor.name);
                setPage('people');
              }}
              className="glass p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-brand-gold/30 hover:scale-[1.02] transition-all duration-300"
            >
              <img 
                src={actor.image} 
                alt={actor.name} 
                className="w-14 h-14 rounded-full object-cover border border-white/10"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <h3 className="font-bold text-white text-sm hover:text-brand-gold transition">{actor.name}</h3>
                <p className="text-xs text-brand-muted">{actor.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
