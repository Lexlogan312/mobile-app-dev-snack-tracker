import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { format, subDays, isAfter } from 'date-fns';
import { Share } from '@capacitor/share';
import { Download, LogOut, Package, TrendingUp, AlertTriangle, Lightbulb, Users } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import Loader from '../components/common/Loader';
import { useSnacks } from '../hooks/useSnacks';
import { useConsumptionLog } from '../hooks/useConsumptionLog';
import { useShoppingList } from '../hooks/useShoppingList';
import { useSuggestions } from '../hooks/useSuggestions';

import { useSettings } from '../hooks/useSettings';

const AdminDashboard = () => {
  const { snacks, loading: snacksLoading } = useSnacks();
  const { logs, loading: logsLoading } = useConsumptionLog();
  const { shoppingList, loading: shoppingLoading } = useShoppingList();
  const { suggestions, loading: suggestionsLoading } = useSuggestions();
  const { globalThreshold } = useSettings();
  
  const [timeframe, setTimeframe] = useState(7); // 7 or 30 days

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleExportSummary = async () => {
    const text = [
      "Super Snack Snatcher Inventory Summary",
      `Generated: ${format(new Date(), 'PPpp')}`,
      "----------------------------------------",
      ...snacks.map(s => 
        `${s.name} | Qty: ${s.quantity} | Cat: ${s.category} | Consumed: ${s.timesConsumed || 0} | Shopping List: ${s.isOnShoppingList ? 'Yes' : 'No'}`
      )
    ].join('\n');

    try {
      await Share.share({
        title: 'Inventory Summary',
        text: text,
        dialogTitle: 'Share Inventory Summary',
      });
      toast.success('Summary exported!');
    } catch (error) {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
  };

  const stats = useMemo(() => {
    if (!snacks.length) return { totalVarieties: 0, totalItems: 0, lowStock: 0, totalConsumed: 0, mostPopular: null, leastPopular: null, allergyFriendly: 0 };
    
    const totalItems = snacks.reduce((sum, s) => sum + s.quantity, 0);
    const lowStock = snacks.filter(s => {
      const threshold = s.lowStockThreshold !== undefined && s.lowStockThreshold !== null && s.lowStockThreshold !== '' 
        ? s.lowStockThreshold 
        : globalThreshold;
      return s.quantity <= threshold;
    }).length;
    const totalConsumed = snacks.reduce((sum, s) => sum + (s.timesConsumed || 0), 0);
    const sortedByPopularity = [...snacks].sort((a, b) => (b.timesConsumed || 0) - (a.timesConsumed || 0));
    const allergyFriendly = snacks.filter(s => !s.allergens || s.allergens.length === 0).length;
    
    return {
      totalVarieties: snacks.length,
      totalItems,
      lowStock,
      totalConsumed,
      mostPopular: sortedByPopularity[0],
      leastPopular: sortedByPopularity[sortedByPopularity.length - 1],
      allergyFriendly
    };
  }, [snacks, globalThreshold]);

  const categoryData = useMemo(() => {
    const counts = {};
    snacks.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [snacks]);

  const COLORS = ['#7C3AED', '#A78BFA', '#EDE9FE', '#F472B6', '#FBCFE8', '#38BDF8', '#BAE6FD'];

  const chartData = useMemo(() => {
    if (!logs.length) return [];
    
    const cutoffDate = subDays(new Date(), timeframe);
    const recentLogs = logs.filter(log => log.consumedAt && isAfter(log.consumedAt.toDate(), cutoffDate));
    
    // Group by day
    const grouped = recentLogs.reduce((acc, log) => {
      const dateStr = format(log.consumedAt.toDate(), 'MMM dd');
      if (!acc[dateStr]) acc[dateStr] = 0;
      acc[dateStr] += log.quantity;
      return acc;
    }, {});

    // Fill in missing days
    const data = [];
    for (let i = timeframe - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'MMM dd');
      data.push({
        date: dateStr,
        consumed: grouped[dateStr] || 0
      });
    }
    
    return data;
  }, [logs, timeframe]);

  if (snacksLoading || logsLoading || shoppingLoading || suggestionsLoading) return <PageWrapper><Loader /></PageWrapper>;

  return (
    <PageWrapper className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-display text-[var(--color-text-primary)] tracking-tight">Dashboard</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 font-medium">Inventory overview</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportSummary}
            className="p-3 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-glow)] transition-colors"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
          <Package className="text-[var(--color-primary-light)] mb-2" size={24} />
          <span className="text-4xl font-display text-[var(--color-primary)]">{stats.totalVarieties}</span>
          <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mt-1">Varieties</span>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
          <Package className="text-[var(--color-secondary)] mb-2" size={24} />
          <span className="text-4xl font-display text-[var(--color-secondary)]">{stats.totalItems}</span>
          <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mt-1">Items In Stock</span>
        </div>
        <div className="bg-red-50 p-5 rounded-3xl shadow-sm border border-red-100 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="text-red-400 mb-2" size={24} />
          <span className="text-4xl font-display text-red-500">{stats.lowStock}</span>
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider mt-1">Low/Out of Stock</span>
        </div>
        <div className="bg-[var(--color-primary-soft)] p-5 rounded-3xl shadow-sm border border-[var(--color-primary-glow)] flex flex-col items-center justify-center text-center">
          <TrendingUp className="text-[var(--color-primary)] mb-2" size={24} />
          <span className="text-4xl font-display text-[var(--color-primary)]">{stats.totalConsumed}</span>
          <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mt-1">Total Consumed</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display text-[var(--color-text-primary)]">Consumption Trends</h3>
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(Number(e.target.value))}
            className="bg-[var(--color-background)] border-2 border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] rounded-xl px-3 py-1 outline-none focus:border-[var(--color-primary)]"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: 'var(--color-primary-soft)', opacity: 0.5}}
                contentStyle={{borderRadius: '16px', border: '2px solid var(--color-border)', boxShadow: '0 4px 20px rgba(124,58,237,0.1)', fontWeight: 'bold'}}
              />
              <Bar dataKey="consumed" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="var(--color-primary)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-4">Top 3 Consumed</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-[var(--color-border)] overflow-hidden">
            {[...snacks].sort((a, b) => (b.timesConsumed || 0) - (a.timesConsumed || 0)).slice(0, 3).map((snack, i) => (
              <div key={snack.id} className="flex justify-between items-center p-4 border-b border-[var(--color-border)] last:border-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-white ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-300' : 'bg-orange-300'}`}>
                    {i + 1}
                  </div>
                  <span className="font-bold text-[var(--color-text-primary)]">{snack.name}</span>
                </div>
                <span className="text-sm font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)] px-3 py-1 rounded-full border border-[var(--color-primary-glow)]">
                  {snack.timesConsumed || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-4">Category Breakdown</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-[var(--color-border)] p-4 h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: '2px solid var(--color-border)', fontWeight: 'bold'}}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 p-5 rounded-3xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-display text-green-600">{stats.allergyFriendly}</span>
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider mt-1">Allergy-Friendly<br/>Snacks</span>
        </div>
        <div className="bg-blue-50 p-5 rounded-3xl shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center">
          <Lightbulb className="text-blue-400 mb-2" size={24} />
          <span className="text-3xl font-display text-blue-600">{suggestions.filter(s => s.status === 'pending').length}</span>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider mt-1">Pending<br/>Suggestions</span>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-4">Suggestion Status Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 p-4 rounded-3xl shadow-sm border border-yellow-100 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-display text-yellow-600">{suggestions.filter(s => s.status === 'pending').length}</span>
            <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider mt-1">Pending</span>
          </div>
          <div className="bg-green-50 p-4 rounded-3xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-display text-green-600">{suggestions.filter(s => s.status === 'approved').length}</span>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider mt-1">Approved</span>
          </div>
          <div className="bg-red-50 p-4 rounded-3xl shadow-sm border border-red-100 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-display text-red-600">{suggestions.filter(s => s.status === 'declined').length}</span>
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider mt-1">Declined</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-4">Popularity Extremes</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-[var(--color-border)]">
            <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Most Popular</p>
            <p className="font-bold text-[var(--color-primary)] text-lg line-clamp-1">{stats.mostPopular?.name || 'N/A'}</p>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">{stats.mostPopular?.timesConsumed || 0} eaten</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-[var(--color-border)]">
            <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Least Popular</p>
            <p className="font-bold text-gray-600 text-lg line-clamp-1">{stats.leastPopular?.name || 'N/A'}</p>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">{stats.leastPopular?.timesConsumed || 0} eaten</p>
          </div>
        </div>
      </div>

    </PageWrapper>
  );
};

export default AdminDashboard;
