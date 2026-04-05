import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UserCheck, ShieldCheck, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Faculty } from '../types';

export const DepartmentModule = ({ departments, onRefresh }: { departments: Department[], onRefresh: () => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [defaultFaculties, setDefaultFaculties] = useState<Record<number, any>>({});

  useEffect(() => {
    const fetchDefaultFaculties = async () => {
      const results: Record<number, any> = {};
      await Promise.all(departments.map(async (dept) => {
        const res = await fetch(`/api/departments/${dept.id}/default-faculty`);
        if (res.ok) {
          results[dept.id] = await res.json();
        }
      }));
      setDefaultFaculties(results);
    };
    if (departments.length > 0) {
      fetchDefaultFaculties();
    }
  }, [departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/departments/${editingId}` : '/api/departments';
    const method = editingId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setFormData({ code: '', name: '' });
      setIsAdding(false);
      setEditingId(null);
      onRefresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
  };

  const handleDeleteDefaultFaculty = async (deptId: number) => {
    if (!confirm('Are you sure you want to delete the default faculty for this department?')) return;
    const res = await fetch(`/api/departments/${deptId}/default-faculty`, { method: 'DELETE' });
    if (res.ok) {
      onRefresh(); // This will trigger the useEffect to re-fetch
    }
  };

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Departments</h2>
          <div className="flex space-x-3">
            <button 
              onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ code: '', name: '' }); }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Code</label>
                <input 
                  type="text" 
                  disabled={!!editingId}
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. CSE"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium">
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const defFaculty = defaultFaculties[dept.id];
          return (
            <div key={dept.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-lg">
                  {dept.code}
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingId(dept.id); setFormData({ code: dept.code, name: dept.name }); setIsAdding(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(dept.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{dept.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{dept.student_count} Students Enrolled</p>
              
              {defFaculty ? (
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <UserCheck size={16} />
                    <span className="text-xs font-bold">{defFaculty.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteDefaultFaculty(dept.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Default Faculty"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-50">
                  <span className="text-xs text-slate-400 italic">No default faculty assigned</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
};
