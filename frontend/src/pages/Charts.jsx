import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, TrendingUp, DollarSign, Calendar, Eye } from 'lucide-react';
import api from '../utils/api';

export default function Charts({ setPage, setSelectedMovieId }) {
  const [activeTab, setActiveTab] = useState('top250');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/charts/${activeTab}`);
        if (response.data?.success) {
          setData(response.data.data || []);
        } else {
          setError(response.data?.error || 'Failed to load chart data.');
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Error connecting to the chart service.');
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [activeTab]);

  return (
    <div className="space-y-8 pb-12 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">IMDb Charts & Rankings</h1>
        <p className="text-brand-muted text-sm">Real-time collections of top-rated movies, trending hits, and box office grosses.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border gap-2">
        {[
          { id: 'top250', label: 'Top 250 Movies', icon: Award },
          { id: 'popular', label: 'Most Popular', icon: TrendingUp },
          { id: 'boxoffice', label: 'Box Office Grosses', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-3 font-semibold text-sm transition ${
                isActive ? 'text-brand-accent' : 'text-brand-muted hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeChartTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-sm">
          {error}
        </div>
      )}

      {/* Content Table / Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 rounded-xl skeleton" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-2xl border border-brand-border overflow-hidden"
          >
            {activeTab === 'boxoffice' ? (
              /* Custom Box Office Mojo table layout */
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-200">
                  <thead className="text-xs uppercase bg-white/5 text-brand-muted border-b border-brand-border">
                    <tr>
                      <th className="px-6 py-4 font-bold text-center w-16">Rank</th>
                      <th className="px-6 py-4 font-bold">Title</th>
                      <th className="px-6 py-4 font-bold text-right">Weekend Gross</th>
                      <th className="px-6 py-4 font-bold text-right">Total Gross</th>
                      <th className="px-6 py-4 font-bold text-center">Theaters</th>
                      <th className="px-6 py-4 font-bold text-center">Weeks</th>
                      <th className="px-6 py-4 font-bold">Distributor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {data.map((item, idx) => (
                      <tr 
                        key={idx}
                        onClick={() => {
                          if (item.id) {
                            setSelectedMovieId(item.id);
                            setPage('movie-details');
                          }
                        }}
                        className={`hover:bg-white/5 transition duration-150 ${item.id ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <td className="px-6 py-4 text-center font-bold text-white text-base">{item.rank}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.poster_url && (
                              <img src={item.poster_url} alt={item.title} className="w-10 h-14 object-cover rounded border border-white/5 flex-shrink-0" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                            )}
                            <div>
                              <p className="font-extrabold text-white group-hover:text-brand-accent transition">{item.title}</p>
                              {item.year && <p className="text-[10px] text-brand-muted mt-0.5">{item.year}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-brand-accent">{item.weekend_gross}</td>
                        <td className="px-6 py-4 text-right font-medium text-white">{item.total_gross}</td>
                        <td className="px-6 py-4 text-center text-brand-muted">{item.theaters}</td>
                        <td className="px-6 py-4 text-center font-bold text-white">{item.weeks}</td>
                        <td className="px-6 py-4 text-brand-muted">{item.distributor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Top 250 / Popular Table layout */
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-200">
                  <thead className="text-xs uppercase bg-white/5 text-brand-muted border-b border-brand-border">
                    <tr>
                      <th className="px-6 py-4 font-bold text-center w-16">Rank</th>
                      <th className="px-6 py-4 font-bold">Title</th>
                      <th className="px-6 py-4 font-bold text-center">Release Year</th>
                      <th className="px-6 py-4 font-bold text-center">IMDb Rating</th>
                      <th className="px-6 py-4 font-bold">Genres</th>
                      <th className="px-6 py-4 font-bold text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {data.map((item, idx) => (
                      <tr 
                        key={item.id || idx}
                        onClick={() => {
                          setSelectedMovieId(item.id);
                          setPage('movie-details');
                        }}
                        className="hover:bg-white/5 transition duration-150 cursor-pointer group"
                      >
                        <td className="px-6 py-4 text-center font-bold text-white text-base">{item.rank}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.title} className="w-10 h-14 object-cover rounded border border-white/5 flex-shrink-0" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                            )}
                            <div>
                              <p className="font-extrabold text-white group-hover:text-brand-accent transition">{item.title}</p>
                              {item.original_title && item.original_title !== item.title && (
                                <p className="text-[10px] text-brand-muted italic mt-0.5">Original: {item.original_title}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-brand-muted">{item.year}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-2 py-0.5 rounded text-xs">
                            ⭐ {item.rating || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-brand-muted">
                          {item.genres?.slice(0, 3).join(', ')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-semibold text-brand-accent group-hover:underline flex items-center justify-center gap-1">
                            <Eye className="w-4 h-4" /> View Details
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && data.length === 0 && (
              <div className="text-center py-16 space-y-2 text-brand-muted">
                <p className="text-base font-semibold">No titles found.</p>
                <p className="text-xs">Database query returned an empty result.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
