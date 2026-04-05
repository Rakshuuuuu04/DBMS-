import React from 'react';
import { Building2, Users, UserSquare2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { DashboardStats } from '../types';
import { StatCard } from './Common';

export const AdminDashboard = ({ stats, onRefresh }: { stats: DashboardStats | null; onRefresh?: () => void }) => {
  const handleDeleteDefault = async (departmentId: number) => {
    if (!confirm('Are you sure you want to remove this default faculty assignment?')) return;
    
    try {
      const res = await fetch(`/api/admin/default-faculty/${departmentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error deleting default faculty:', error);
    }
  };

  if (!stats) return <div className="animate-pulse space-y-4">
    <div className="h-32 bg-slate-100 rounded-2xl w-full"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-64 bg-slate-100 rounded-2xl"></div>
      <div className="h-64 bg-slate-100 rounded-2xl"></div>
    </div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Departments" value={stats.totalDepartments} icon={Building2} color="bg-blue-500" />
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="bg-indigo-500" />
        <StatCard label="Total Faculty" value={stats.totalFaculty} icon={UserSquare2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Default Faculty per Department</h3>
          <div className="space-y-4">
            {stats.defaultFacultyStats && stats.defaultFacultyStats.length > 0 ? (
              stats.defaultFacultyStats.map((df, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{df.department_name}</p>
                    <p className="text-sm font-bold text-slate-900">{df.faculty_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleDeleteDefault(df.department_id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Remove Default Faculty"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Building2 size={16} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-xs text-slate-400 italic">No default faculty assigned yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Students per Department</h3>
          <div className="space-y-4">
            {stats.deptStats.map((dept, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">{dept.name}</span>
                  <span className="text-slate-900 font-bold">{dept.student_count} Students</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(dept.student_count / (stats.totalStudents || 1)) * 100}%` }}
                    className="bg-indigo-500 h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Students per Year</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.yearStats.map((year, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Year {year.year}</p>
                <p className="text-2xl font-black text-indigo-600">{year.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
