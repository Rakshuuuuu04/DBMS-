import React from 'react';

export const SidebarItem = ({ icon: Icon, label, active, onClick, dark }: { icon: any, label: string, active: boolean, onClick: () => void, dark?: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg ' + (dark ? 'shadow-indigo-900/20' : 'shadow-indigo-200')
        : dark 
          ? 'text-slate-400 hover:bg-slate-800 hover:text-indigo-400'
          : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'
    }`}
  >
    <Icon size={20} className={`${active ? 'text-white' : dark ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`} />
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

export const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: number | string, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);
