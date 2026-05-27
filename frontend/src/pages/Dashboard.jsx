import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, RefreshCw, Activity, Clock, Copy, Check, Eye, EyeOff, Sliders, AlertCircle } from 'lucide-react';
import api, { getDeveloperKey, setDeveloperKey, getEffectiveKey } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const currentKey = getDeveloperKey();
  const effectiveKey = getEffectiveKey();

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      // Direct call to developer stats endpoint
      const response = await api.get('/developer/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        setError(response.data?.error || 'Failed to fetch usage metrics.');
      }
    } catch (err) {
      setError('Create or configure your private API Key to track detailed stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentKey]);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!ownerName.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const response = await api.get(`/generate-key?owner=${encodeURIComponent(ownerName)}`);
      if (response.data?.success) {
        const newKey = response.data.api_key;
        setDeveloperKey(newKey);
        setOwnerName('');
        // Trigger fetch stats
        fetchStats();
      } else {
        setError(response.data?.error || 'Failed to register developer key.');
      }
    } catch (err) {
      setError('Error connecting to the registration service.');
    } finally {
      setGenerating(false);
    }
  };

  const handleClearKey = () => {
    setDeveloperKey('');
    setStats(null);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(effectiveKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Developer Dashboard</h1>
        <p className="text-brand-muted text-sm">Monitor your API request volumes, register custom endpoints keys, and track latency metrics.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border border-brand-border flex items-center gap-4">
          <div className="p-3 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl text-brand-accent">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-muted uppercase">Total API Requests</span>
            <h3 className="text-3xl font-black text-white mt-0.5">
              {stats ? stats.total_requests : '0'}
            </h3>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-brand-border flex items-center gap-4">
          <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl text-brand-gold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-muted uppercase">Average Latency</span>
            <h3 className="text-3xl font-black text-white mt-0.5">
              {stats ? `${stats.average_response_time_ms} ms` : '0 ms'}
            </h3>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-brand-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-muted uppercase">Key Type</span>
            <h3 className="text-xl font-bold text-white mt-1">
              {currentKey ? 'Private Developer' : 'Public Sandbox (Demo)'}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Key Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-brand-border space-y-6">
            <div>
              <h3 className="font-extrabold text-white text-base">Key Management</h3>
              <p className="text-xs text-brand-muted mt-1">Generate a private developer key to avoid public rate-limiting.</p>
            </div>

            {/* Key display block */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Your API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  readOnly
                  value={effectiveKey}
                  className="w-full pl-4 pr-24 py-3 bg-brand-dark rounded-xl border border-brand-border text-xs font-mono text-gray-300 focus:outline-none"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 hover:bg-white/5 rounded text-brand-muted hover:text-white transition"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCopyKey}
                    className="p-1.5 hover:bg-white/5 rounded text-brand-muted hover:text-white transition"
                    title="Copy API Key"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {currentKey ? (
              <button
                onClick={handleClearKey}
                className="w-full py-2.5 bg-brand-border hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-brand-border transition"
              >
                Use Demo Sandbox Key
              </button>
            ) : (
              <form onSubmit={handleGenerateKey} className="space-y-3 pt-4 border-t border-brand-border">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Register New Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter owner name..."
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 bg-brand-dark rounded-xl border border-brand-border text-xs text-white focus:border-brand-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-2 bg-brand-accent hover:bg-brand-accentHover disabled:bg-brand-accent/50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Register'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Analytics & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-3xl border border-brand-border space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-white text-base">Usage Analytics</h3>
                <p className="text-xs text-brand-muted mt-1">Real-time stats log of endpoints hit with your active key.</p>
              </div>
              <button
                onClick={fetchStats}
                className="p-2 hover:bg-white/5 rounded-xl border border-brand-border text-brand-muted hover:text-white transition"
                title="Refresh metrics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-brand-gold/5 border border-brand-gold/15 flex items-center gap-3 text-brand-gold text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Custom Progress Bars for Endpoints popularity */}
            {stats && stats.endpoint_usage.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-brand-muted">Endpoint Usage Breakdown</h4>
                <div className="space-y-3">
                  {stats.endpoint_usage.map((item, idx) => {
                    const maxCount = stats.endpoint_usage[0].count;
                    const percent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <code className="text-brand-accent font-mono">{item.endpoint}</code>
                          <span className="text-white font-bold">{item.count} requests</span>
                        </div>
                        <div className="w-full h-2 bg-brand-dark rounded-full overflow-hidden border border-brand-border">
                          <div 
                            className="h-full bg-brand-accent rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              !loading && (
                <div className="text-center py-16 space-y-2 text-brand-muted">
                  <Sliders className="w-12 h-12 stroke-[1.2] mx-auto text-brand-muted" />
                  <p className="text-sm font-semibold">No requests logged yet.</p>
                  <p className="text-xs">Your API request telemetry will display here once you hit endpoints.</p>
                </div>
              )
            )}

            {loading && (
              <div className="space-y-4 py-8">
                <div className="h-6 skeleton rounded w-1/3" />
                <div className="h-2 skeleton rounded w-full" />
                <div className="h-2 skeleton rounded w-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
