import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home as HomeIcon, 
  Search as SearchIcon, 
  Award, 
  Code, 
  LayoutDashboard, 
  Film,
  Menu,
  X
} from 'lucide-react';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import MovieDetails from './pages/MovieDetails';
import Charts from './pages/Charts';
import Docs from './pages/Docs';
import Dashboard from './pages/Dashboard';
import People from './pages/People';

export default function App() {
  const [page, setPage] = useState('home');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'search', label: 'Search', icon: SearchIcon },
    { id: 'charts', label: 'Charts & Rankings', icon: Award },
    { id: 'docs', label: 'API Reference', icon: Code },
    { id: 'dashboard', label: 'Dev Dashboard', icon: LayoutDashboard }
  ];

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <Home 
            setPage={setPage} 
            setSelectedMovieId={setSelectedMovieId} 
            setSearchQuery={setSearchQuery} 
          />
        );
      case 'search':
        return (
          <Search 
            page={page}
            setPage={setPage} 
            setSelectedMovieId={setSelectedMovieId} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'movie-details':
        return (
          <MovieDetails 
            titleId={selectedMovieId} 
            setPage={setPage} 
          />
        );
      case 'charts':
        return (
          <Charts 
            setPage={setPage} 
            setSelectedMovieId={setSelectedMovieId} 
          />
        );
      case 'docs':
        return <Docs />;
      case 'dashboard':
        return <Dashboard />;
      case 'people':
        return (
          <People 
            nameQuery={searchQuery} 
            setPage={setPage} 
            setSelectedMovieId={setSelectedMovieId} 
          />
        );
      default:
        return <Home setPage={setPage} setSelectedMovieId={setSelectedMovieId} setSearchQuery={setSearchQuery} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200 flex">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass border-r border-brand-border flex flex-col justify-between p-6 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage('home')}>
            <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-accent/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h2 className="font-extrabold text-white text-lg tracking-tight">CineAPI</h2>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">IMDb Scraper Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = page === item.id || (item.id === 'search' && page === 'people');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 font-semibold text-sm rounded-xl transition-all duration-200 relative ${
                    isActive 
                      ? 'text-white' 
                      : 'text-brand-muted hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-accent' : ''}`} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-brand-accent/10 border-l-2 border-brand-accent rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="text-left border-t border-brand-border pt-6 text-[10px] text-brand-muted space-y-1">
          <p>© 2026 CineAPI Project</p>
          <p>Powered by FastAPI & React</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 flex items-center justify-between border-b border-brand-border bg-brand-dark/80 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-extrabold text-white text-sm">CineAPI</h2>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-xl border border-brand-border text-gray-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Dynamic Page Rendering */}
        <main className="flex-1 p-6 md:p-12 max-w-7xl w-full mx-auto overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </div>
  );
}
