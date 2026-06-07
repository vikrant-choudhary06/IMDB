import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ExternalLink, Globe, HelpCircle, Code, ArrowRight } from 'lucide-react';
import { getEffectiveKey, DEFAULT_BACKEND_URL } from '../utils/api';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/search',
    description: 'Search movies, TV shows, and people by name query string.',
    params: [
      { name: 'q', type: 'string', required: true, desc: 'The search query (e.g., Batman, Nolan)' },
      { name: 'limit', type: 'integer', required: false, desc: 'Limit the number of suggestions (default: 20)' }
    ],
    sampleResponse: {
      success: true,
      data: {
        results: [
          {
            type: 'Title',
            id: 'tt1375666',
            name: 'Inception',
            year: 2010,
            description: 'Christopher Nolan, Leonardo DiCaprio',
            rank: 850,
            image: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg'
          }
        ]
      },
      source: 'imdb'
    }
  },
  {
    method: 'GET',
    path: '/api/title/{id}',
    description: 'Retrieve detailed movie metadata, plot, genres, cast, user reviews, videos, images, and streaming providers by IMDb ID.',
    params: [
      { name: 'id', type: 'string', required: true, desc: 'The IMDb title ID (e.g., tt1375666)' }
    ],
    sampleResponse: {
      success: true,
      data: {
        id: 'tt1375666',
        title: 'Inception',
        year: 2010,
        rating: 8.8,
        poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology...',
        genres: ['Action', 'Sci-Fi', 'Adventure'],
        cast: [{ name: 'Leonardo DiCaprio', characters: ['Cobb'] }],
        videos: [],
        images: [],
        reviews: [],
        streaming: []
      },
      source: 'imdb'
    }
  },
  {
    method: 'GET',
    path: '/api/trending',
    description: 'Fetch the top trending movies on IMDb in the last few hours/days.',
    params: [
      { name: 'count', type: 'integer', required: false, desc: 'Number of trending items to return (default: 8)' }
    ],
    sampleResponse: {
      success: true,
      data: [
        {
          id: 'tt23849204',
          title: 'Dune: Part Two',
          year: 2024,
          rating: 8.6,
          poster_url: '...',
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          rank: 1
        }
      ],
      source: 'imdb'
    }
  },
  {
    method: 'GET',
    path: '/api/charts/{chart_type}',
    description: 'Retrieve rank charts like Top 250, Popular, and Box Office.',
    params: [
      { name: 'chart_type', type: 'string', required: true, desc: 'The chart type: top250, popular, boxoffice' }
    ],
    sampleResponse: {
      success: true,
      data: [
        {
          rank: 1,
          id: 'tt0111161',
          title: 'The Shawshank Redemption',
          year: 1994,
          rating: 9.3,
          genres: ['Drama']
        }
      ],
      source: 'imdb'
    }
  },
  {
    method: 'GET',
    path: '/api/people/{name}',
    description: 'Retrieve detailed biography, professions, headshot, and known-for titles for actors/directors by name or IMDb ID.',
    params: [
      { name: 'name', type: 'string', required: true, desc: 'The person name (e.g. Leonardo DiCaprio) or ID (e.g. nm0000138)' }
    ],
    sampleResponse: {
      success: true,
      data: {
        id: 'nm0000138',
        name: 'Leonardo DiCaprio',
        image: '...',
        professions: ['Actor', 'Producer'],
        birth_date: '1974-11-11',
        birth_place: 'Los Angeles, California, USA',
        bio: 'Leonardo Wilhelm DiCaprio is an award-winning actor...'
      },
      source: 'imdb'
    }
  },
  {
    method: 'GET',
    path: '/api/rottentomatoes/{id}',
    description: 'Fetch Rotten Tomatoes Tomatometer, review count, synopsis, and cast data for an IMDb ID.',
    params: [
      { name: 'id', type: 'string', required: true, desc: 'The IMDb title ID (e.g., tt1375666)' }
    ],
    sampleResponse: {
      success: true,
      data: {
        name: 'Inception',
        type: 'Movie',
        ems_id: '...',
        rating: {
          value: 87,
          count: 381
        }
      },
      source: 'rottentomatoes'
    }
  }
];

export default function Docs() {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [snippetLang, setSnippetLang] = useState('javascript');
  
  const devKey = getEffectiveKey();
  const baseUrl = DEFAULT_BACKEND_URL.endsWith('/api') ? DEFAULT_BACKEND_URL.slice(0, -4) : DEFAULT_BACKEND_URL;

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getCodeSnippet = (endpoint) => {
    let url = `${baseUrl}${endpoint.path}`;
    // Replace parameters for preview
    url = url.replace('{id}', 'tt1375666').replace('{chart_type}', 'top250').replace('{name}', 'nm0000138');
    if (endpoint.params.some(p => p.name === 'q')) {
      url += '?q=Inception';
    }

    if (snippetLang === 'javascript') {
      return `fetch('${url}', {
  headers: {
    'x-api-key': '${devKey}'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));`;
    } else if (snippetLang === 'python') {
      return `import requests

url = "${url}"
headers = {
    "x-api-key": "${devKey}"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
    } else if (snippetLang === 'node') {
      return `const axios = require('axios');

axios.get('${url}', {
  headers: {
    'x-api-key': '${devKey}'
  }
})
  .then(response => {
    console.log(response.data);
  });`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 text-left">
      {/* Endpoints Sidebar */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Globe className="w-8 h-8 text-brand-accent" /> API Reference
          </h1>
          <p className="text-brand-muted text-sm">
            Integrate public IMDb scraper capabilities into your own products. Pass headers with your private key to bypass rate limits.
          </p>
        </div>

        <div className="space-y-4">
          {ENDPOINTS.map((endpoint, index) => {
            const isExpanded = expandedIndex === index;
            const fullUrl = `${baseUrl}${endpoint.path}`;
            return (
              <div 
                key={index} 
                className={`glass rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isExpanded ? 'border-brand-accent/30 ring-1 ring-brand-accent/15' : 'border-brand-border hover:border-white/10'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                  className="w-full p-4 flex items-center justify-between gap-4 bg-white/[0.01]"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="px-2 py-0.5 text-[10px] font-black rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-bold text-white truncate font-mono">
                      {endpoint.path}
                    </code>
                  </div>
                  <span className="text-xs text-brand-muted font-bold">
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </span>
                </button>

                {/* Accordion Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-brand-border bg-black/10 overflow-hidden"
                    >
                      <div className="p-6 space-y-6">
                        <p className="text-sm text-gray-300 leading-relaxed">{endpoint.description}</p>

                        {/* Parameters */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-white text-xs uppercase tracking-wider text-brand-muted">Parameters</h4>
                          <div className="space-y-2">
                            {endpoint.params.map(p => (
                              <div key={p.name} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 p-3 rounded-xl bg-white/[0.02] border border-brand-border text-xs">
                                <span className="font-bold text-white font-mono">{p.name}</span>
                                <span className="text-brand-muted font-semibold">({p.type}, {p.required ? 'required' : 'optional'})</span>
                                <span className="text-gray-300 md:ml-auto">{p.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Request Code Snippet */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-brand-muted">Integrate</h4>
                            <div className="flex gap-2">
                              {['javascript', 'python', 'node'].map(lang => (
                                <button
                                  key={lang}
                                  onClick={() => setSnippetLang(lang)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider border transition ${
                                    snippetLang === lang 
                                      ? 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent' 
                                      : 'bg-white/5 border-transparent text-brand-muted hover:text-white'
                                  }`}
                                >
                                  {lang}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="relative group/snippet">
                            <pre className="p-4 bg-brand-dark/80 rounded-xl border border-brand-border overflow-x-auto text-[11px] font-mono text-emerald-400 leading-relaxed">
                              {getCodeSnippet(endpoint)}
                            </pre>
                            <button
                              onClick={() => copyToClipboard(getCodeSnippet(endpoint), index)}
                              className="absolute top-3 right-3 p-2 bg-brand-card hover:bg-brand-border rounded-lg border border-brand-border opacity-0 group-hover/snippet:opacity-100 transition duration-200"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-300" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Preview Panel */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Code className="w-6 h-6 text-brand-gold" /> Response Preview
        </h2>
        <div className="glass rounded-3xl p-6 border border-brand-border sticky top-6 space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm">
              {ENDPOINTS[expandedIndex]?.path || '/api/search'}
            </h3>
            <p className="text-xs text-brand-muted mt-1">Sample successful JSON payload.</p>
          </div>
          <pre className="p-4 bg-brand-dark/90 rounded-2xl border border-brand-border text-[10px] font-mono text-cyan-400 overflow-x-auto max-h-[480px] leading-normal">
            {JSON.stringify(ENDPOINTS[expandedIndex]?.sampleResponse || {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
