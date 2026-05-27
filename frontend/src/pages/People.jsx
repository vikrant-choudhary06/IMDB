import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MapPin, AlignLeft, Star, Film, Award, HelpCircle } from 'lucide-react';
import api from '../utils/api';

export default function People({ nameQuery, setPage, setSelectedMovieId }) {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPersonDetails() {
      if (!nameQuery) return;
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/people/${encodeURIComponent(nameQuery)}`);
        if (response.data?.success) {
          setPerson(response.data.data);
        } else {
          setError(response.data?.error || 'Failed to fetch person details.');
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Person details not found.');
      } finally {
        setLoading(false);
      }
    }
    fetchPersonDetails();
  }, [nameQuery]);

  if (loading) {
    return (
      <div className="space-y-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-[400px] rounded-2xl skeleton" />
          <div className="md:col-span-2 space-y-4">
            <div className="h-10 w-2/3 skeleton rounded-lg" />
            <div className="h-6 w-1/4 skeleton rounded-lg" />
            <div className="h-32 w-full skeleton rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <User className="w-16 h-16 text-brand-gold mx-auto stroke-[1.2]" />
        <h2 className="text-xl font-bold text-white">Person Not Found</h2>
        <p className="text-sm text-brand-muted">{error || 'Could not find details for this actor/director.'}</p>
        <button 
          onClick={() => setPage('home')}
          className="px-6 py-2 bg-brand-accent hover:bg-brand-accentHover text-white font-bold rounded-xl transition"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16 text-left">
      {/* Main Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Left Column: Image Card */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-brand-border shadow-2xl aspect-[3/4] w-full bg-brand-dark">
            {person.image ? (
              <img 
                src={person.image} 
                alt={person.name} 
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-muted">
                <User className="w-20 h-20 stroke-[1.2]" />
              </div>
            )}
          </div>

          {person.rank && (
            <div className="glass p-4 rounded-2xl text-center border border-brand-border">
              <span className="text-[10px] font-bold uppercase text-brand-muted">IMDb STARmeter Rank</span>
              <h4 className="text-2xl font-black text-brand-gold mt-1">#{person.rank}</h4>
            </div>
          )}
        </div>

        {/* Right Column: Bio Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {person.name}
            </h1>
            <p className="text-xs font-semibold text-brand-accent uppercase tracking-wider mt-1">
              {person.professions?.join(' • ')}
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-brand-muted">
            {person.birth_date && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-brand-border">
                <Calendar className="w-4 h-4 text-brand-accent" />
                <span className="text-gray-300">Born: {person.birth_date}</span>
              </div>
            )}
            {person.birth_place && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-brand-border">
                <MapPin className="w-4 h-4 text-brand-gold" />
                <span className="text-gray-300 truncate" title={person.birth_place}>From: {person.birth_place}</span>
              </div>
            )}
          </div>

          {/* Biography */}
          {person.bio && (
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider text-brand-muted flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4" /> Biography
              </h3>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                {person.bio}
              </p>
            </div>
          )}

          {/* Nicknames / AKAs */}
          {((person.nicknames && person.nicknames.length > 0) || (person.akas && person.akas.length > 0)) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {person.nicknames?.map(n => (
                <span key={n} className="px-2.5 py-1 bg-white/5 border border-brand-border rounded text-[10px] text-brand-muted">
                  "{n}"
                </span>
              ))}
              {person.akas?.slice(0, 3).map(aka => (
                <span key={aka} className="px-2.5 py-1 bg-white/5 border border-brand-border rounded text-[10px] text-brand-muted">
                  AKA: {aka}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Known For Section */}
      {person.known_for && person.known_for.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-brand-accent" /> Known For
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {person.known_for.map((movie) => (
              <div 
                key={movie.id}
                onClick={() => {
                  setSelectedMovieId(movie.id);
                  setPage('movie-details');
                }}
                className="group cursor-pointer rounded-2xl overflow-hidden glass border border-brand-border hover:border-brand-accent/30 hover:scale-[1.03] transition-all duration-300 flex flex-col justify-between p-3"
              >
                <div className="text-left space-y-1">
                  <h4 className="font-bold text-xs text-white group-hover:text-brand-accent transition line-clamp-2">
                    {movie.title}
                  </h4>
                  <p className="text-[10px] text-brand-muted">{movie.year || 'N/A'} • {movie.type || 'Movie'}</p>
                </div>
                
                {movie.rating && (
                  <div className="pt-2 mt-2 border-t border-brand-border flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-1.5 py-0.5 rounded text-[9px]">
                      ⭐ {movie.rating}
                    </span>
                    <span className="text-[9px] text-brand-muted">ID: {movie.id}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quotes & Trivia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Trivia */}
        {person.trivia && person.trivia.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-gold" /> Trivia
            </h2>
            <div className="glass p-6 rounded-3xl border border-brand-border space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {person.trivia.map((item, idx) => (
                <div key={idx} className="p-3 bg-white/[0.01] border border-brand-border rounded-xl text-xs text-gray-300 leading-relaxed">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotes */}
        {person.quotes && person.quotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-accent" /> Quotes
            </h2>
            <div className="glass p-6 rounded-3xl border border-brand-border space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {person.quotes.map((item, idx) => (
                <blockquote key={idx} className="p-3 bg-white/[0.01] border border-brand-border rounded-xl text-xs text-gray-300 leading-relaxed italic relative pl-8 before:content-['“'] before:absolute before:left-3 before:top-2 before:text-2xl before:text-brand-accent before:font-serif">
                  {item}
                </blockquote>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
