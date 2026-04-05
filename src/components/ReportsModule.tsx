import React from 'react';
import { FileBarChart, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { DashboardStats } from '../types';

export const ReportsModule = ({ stats }: { stats: DashboardStats | null }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileBarChart size={20} />
            </div>
            <h3 className="font-bold text-slate-900">Department Reports</h3>
          </div>
          <div className="space-y-3">
            {['Faculty Directory Report', 'Student Enrollment', 'Faculty Distribution', 'Academic Progress', 'Attendance Summary'].map((report, i) => (
              <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all text-left">
                <span className="text-sm font-medium text-slate-700">{report}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-bold text-slate-900">Student Progress</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Average Attendance</p>
                <p className="text-2xl font-black text-slate-900">84%</p>
              </div>
              <Clock className="text-slate-300" size={32} />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Task Completion</p>
                <p className="text-2xl font-black text-slate-900">72%</p>
              </div>
              <CheckCircle2 className="text-slate-300" size={32} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
