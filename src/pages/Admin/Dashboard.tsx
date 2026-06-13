import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, FileText, TrendingUp, Shield, BarChart3, Settings, LogOut, Bell, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

const stats = [
  { label: 'Neural Nexus Nodes', value: '128,492', icon: Users, color: 'text-blue-500', trend: '+12%' },
  { label: 'Cognitive Queries', value: '4.2M', icon: BarChart3, color: 'text-primary', trend: '+24%' },
  { label: 'Active Protocols', value: '342', icon: Shield, color: 'text-emerald-500', trend: '+5%' },
  { label: 'Pulse Accuracy', value: '99.9%', icon: TrendingUp, color: 'text-purple-500', trend: '+0.2%' }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-dark pt-20 flex">
      {/* Admin Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-white/[0.01] p-6 space-y-8 hidden lg:block">
        <div className="space-y-6">
           <div className="px-2">
              <h2 className="text-xl font-display font-bold text-primary">Nexus Admin</h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">System Authority Level 4</p>
           </div>

           <nav className="space-y-1">
              {[
                { id: 'overview', icon: BarChart3, label: 'Omni Overview' },
                { id: 'users', icon: Users, label: 'User Matrix' },
                { id: 'content', icon: FileText, label: 'Content Hub' },
                { id: 'security', icon: Shield, label: 'Firewall Policy' },
                { id: 'settings', icon: Settings, label: 'Core Config' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all text-left",
                    activeTab === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                  )}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </button>
              ))}
           </nav>
        </div>

        <div className="pt-8 border-t border-white/5">
           <button className="flex items-center gap-3 p-4 w-full text-xs font-black uppercase text-red-500/50 hover:text-red-500 transition-colors">
              <LogOut className="h-4 w-4" /> Terminate Session
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 space-y-12 overflow-y-auto">
         {/* Top Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
               <h1 className="text-4xl font-display font-black tracking-tight">System <span className="text-primary italic">Status</span></h1>
               <p className="text-gray-500 text-sm">Real-time telemetry from the OmniMind neural core.</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium outline-none focus:border-primary/50 transition-all w-64"
                  />
               </div>
               <button className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-colors">
                  <Bell className="h-5 w-5" />
               </button>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 border-white/5 hover:border-primary/20 transition-all space-y-6"
              >
                 <div className="flex justify-between items-start">
                    <div className={cn("p-4 rounded-2xl bg-white/5", stat.color)}>
                       <stat.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{stat.trend}</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-3xl font-display font-black">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
                 </div>
              </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Activity */}
            <div className="lg:col-span-2 glass-card p-8 border-white/5 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black">Recent Acquisitions</h3>
                  <button className="text-xs font-bold text-primary hover:underline">View All Users</button>
               </div>
               <div className="space-y-4">
                  {[
                    { name: 'X-204 Neural Node', email: 'alice.v@matrix.com', status: 'Online', last: '2s ago' },
                    { name: 'Core Vector-9', email: 'bobby.k@nexus.io', status: 'Processing', last: '15m ago' },
                    { name: 'Alpha Observer', email: 'charlie.d@omni.ai', status: 'Offline', last: '1h ago' }
                  ].map((user, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">
                             {user.name[0]}
                          </div>
                          <div>
                             <p className="text-sm font-bold group-hover:text-primary transition-colors">{user.name}</p>
                             <p className="text-[10px] text-gray-600 font-medium">{user.email}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={cn("text-[10px] font-black uppercase tracking-widest", user.status === 'Online' ? 'text-emerald-500' : 'text-gray-500')}>
                             {user.status}
                          </p>
                          <p className="text-[10px] text-gray-700">{user.last}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-8 border-white/5 space-y-8">
               <h3 className="text-xl font-black">Admin Tools</h3>
               <div className="grid grid-cols-1 gap-4">
                  <Link to="/admin/blog" className="flex items-center gap-4 p-5 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary transition-all group">
                     <FileText className="h-6 w-6 text-primary group-hover:text-white" />
                     <div>
                        <p className="text-sm font-bold group-hover:text-white">Broadcast Link</p>
                        <p className="text-[10px] text-primary group-hover:text-white/60">Deploy new journal entries</p>
                     </div>
                  </Link>
                  <button className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 transition-all group">
                     <Users className="h-6 w-6 text-emerald-500 group-hover:text-white" />
                     <div>
                        <p className="text-sm font-bold group-hover:text-white">Audit Nexus</p>
                        <p className="text-[10px] text-emerald-500 group-hover:text-white/60">Generate user report</p>
                     </div>
                  </button>
                  <button className="flex items-center gap-4 p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500 transition-all group">
                     <Shield className="h-6 w-6 text-orange-500 group-hover:text-white" />
                     <div>
                        <p className="text-sm font-bold group-hover:text-white">Purge Cache</p>
                        <p className="text-[10px] text-orange-500 group-hover:text-white/60">Clear neural transients</p>
                     </div>
                  </button>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
