import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, Calendar, Tv, Image as ImageIcon, Play, Film, MessageSquare, AlertCircle, ChevronLeft } from 'lucide-react';
import api from '../utils/api';

export default function MovieDetails({ titleId, setPage }) {
  const [movie, setMovie] = useState(null);
  const [rt, setRt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rtLoading, setRtLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMovieDetails() {
      if (!titleId) return;
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/title/${titleId}`);
        if (response.data?.success) {
          setMovie(response.data.data);
          
          // Trigger RT fetch in background
          fetchRottenTomatoes(titleId);
        } else {
          setError(response.data?.error || 'Failed to fetch movie details.');
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Error loading movie details.');
      } finally {
        setLoading(false);
      }
    }

    async function fetchRottenTomatoes(id) {
      setRtLoading(true);
      try {
        const response = await api.get(`/rottentomatoes/${id}`);
        if (response.data?.success) {
          setRt(response.data.data);
        }
      } catch (err) {
        console.warn('Rotten Tomatoes details not available: ', err);
      } finally {
        setRtLoading(false);
      }
    }

    fetchMovieDetails();
  }, [titleId]);

  if (loading) {
    return (
      <div className="space-y-8 py-12">
        <div className="h-[350px] rounded-3xl skeleton" />
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

  if (error || !movie) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-brand-accent mx-auto stroke-[1.2]" />
        <h2 className="text-xl font-bold text-white">Error Loading Title</h2>
        <p className="text-sm text-brand-muted">{error || 'Title could not be found.'}</p>
        <button 
          onClick={() => setPage('home')}
          className="px-6 py-2 bg-brand-accent hover:bg-brand-accentHover text-white font-bold rounded-xl transition"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  // Find trailer embed URL
  const trailerUrl = movie.trailer?.embedUrl || (movie.videos?.[0]?.urls?.[0]?.url);

  return (
    <div className="space-y-12 pb-16 text-left">
      {/* Back Button */}
      <button 
        onClick={() => setPage('home')}
        className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent transition font-bold"
      >
        <ChevronLeft className="w-5 h-5" /> Back to Home
      </button>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Left Column: Poster Card */}
        <div className="space-y-6">
          <div className="rounded-2xl overflow-hidden border border-brand-border shadow-2xl aspect-[2/3] w-full">
            {movie.poster ? (
              <img 
                src={movie.poster} 
                alt={movie.title} 
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full skeleton flex items-center justify-center text-brand-muted">
                <Film className="w-16 h-16 stroke-[1.2]" />
              </div>
            )}
          </div>

          {/* Rotten Tomatoes scores card */}
          {rt && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-4 rounded-2xl border border-brand-border space-y-4"
            >
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-brand-muted">Rotten Tomatoes</h3>
              <div className="grid grid-cols-2 gap-4 divide-x divide-brand-border text-center">
                <div className="space-y-1">
                  <span className="text-2xl font-black text-brand-accent">
                    {rt.rating?.value ? `${rt.rating.value}%` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-brand-muted font-bold uppercase">Tomatometer</p>
                </div>
                <div className="space-y-1 pl-4">
                  <span className="text-2xl font-black text-brand-gold">
                    {rt.rating?.count || 'N/A'}
                  </span>
                  <p className="text-[10px] text-brand-muted font-bold uppercase">Reviews Count</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Title info */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-brand-muted pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-brand-accent" /> {movie.year || 'N/A'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-brand-gold fill-current" /> {movie.rating || 'N/A'}
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 border border-brand-border rounded bg-white/5 uppercase">
                IMDb: {movie.id}
              </span>
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {movie.genres?.map((g) => (
              <span 
                key={g} 
                className="px-3 py-1 bg-brand-card border border-brand-border text-xs text-white rounded-full font-medium"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Plot */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider text-brand-muted">Synopsis</h3>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              {movie.description || "No plot synopsis is currently available."}
            </p>
          </div>

          {/* Streaming Platforms */}
          {movie.streaming && movie.streaming.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-brand-muted flex items-center gap-2">
                <Tv className="w-4 h-4 text-brand-accent" /> Streaming Availability
              </h3>
              <div className="flex flex-wrap gap-4">
                {movie.streaming.map((stream, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-brand-card border border-brand-border text-xs hover:border-brand-accent/30 transition"
                  >
                    {stream.logo ? (
                      <img src={stream.logo} alt={stream.provider_name} className="w-6 h-6 rounded object-contain" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-6 h-6 bg-brand-border rounded flex items-center justify-center text-[10px]">Tv</div>
                    )}
                    <div>
                      <p className="font-bold text-white">{stream.provider_name || stream.provider}</p>
                      <p className="text-[10px] text-brand-muted">{stream.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Principal Cast Grid */}
          {movie.cast && movie.cast.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-brand-muted">Principal Cast</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {movie.cast.slice(0, 4).map((actor, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-3"
                  >
                    {actor.profile_image ? (
                      <img src={actor.profile_image} alt={actor.name} className="w-10 h-10 rounded-full object-cover border border-white/5" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 bg-brand-border rounded-full flex items-center justify-center text-[10px]">🎭</div>
                    )}
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-white truncate">{actor.name}</p>
                      <p className="text-[10px] text-brand-muted truncate">{actor.characters?.join(', ') || 'Cast'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Videos Section */}
      {movie.videos && movie.videos.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-brand-accent fill-current" /> Videos & Trailer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* If embed trailer exists, render it */}
            {trailerUrl ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-brand-border bg-black shadow-lg">
                <iframe 
                  src={trailerUrl}
                  title="IMDb Video Trailer"
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl border border-brand-border bg-brand-card/40 flex flex-col items-center justify-center gap-2 text-brand-muted">
                <Play className="w-12 h-12 stroke-[1.2]" />
                <span className="text-xs">No direct video player embed available.</span>
              </div>
            )}
            
            {/* Video List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {movie.videos.map((vid, idx) => (
                <a 
                  key={vid.id} 
                  href={vid.urls?.[0]?.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 p-3 bg-brand-card hover:bg-brand-border border border-brand-border rounded-2xl transition group"
                >
                  <img src={vid.thumbnail} alt={vid.name} className="w-24 h-14 object-cover rounded-lg border border-white/5" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                  <div className="overflow-hidden text-left flex-1">
                    <p className="font-bold text-xs text-white group-hover:text-brand-accent transition truncate">{vid.name}</p>
                    <p className="text-[10px] text-brand-muted pt-1">{vid.type} • {Math.floor(vid.runtime / 60)}m {vid.runtime % 60}s</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {movie.images && movie.images.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-gold" /> Image Gallery
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {movie.images.map((img, idx) => (
              <a 
                key={idx} 
                href={img.url} 
                target="_blank" 
                rel="noreferrer" 
                className="aspect-square rounded-xl overflow-hidden border border-brand-border hover:border-brand-accent/50 hover:scale-[1.03] transition-all duration-300 shadow-md group"
              >
                <img src={img.url} alt={img.caption || 'Movie scene'} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* User Reviews */}
      {movie.reviews && movie.reviews.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-accent" /> Featured User Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {movie.reviews.map((rev) => (
              <div 
                key={rev.id} 
                className="p-5 rounded-2xl glass border border-brand-border space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-white text-sm line-clamp-1">{rev.summary}</h3>
                    {rev.rating && (
                      <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded font-bold text-xs">
                        ⭐ {rev.rating}/10
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-4">{rev.text}</p>
                </div>
                <div className="pt-3 border-t border-brand-border text-[10px] text-brand-muted flex justify-between items-center">
                  <span>By: {rev.author}</span>
                  <span>{rev.submission_date?.split('T')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
