import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Evaluation, StudentMark } from '../types';

export const MarksModule = ({ user, departments }: { user: any, departments: Department[] }) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newEval, setNewEval] = useState({
    title: '',
    max_marks: 100,
    type: 'Assignment' as const,
    date: new Date().toISOString().split('T')[0],
    department_id: '',
    year: '1'
  });
  const [loading, setLoading] = useState(false);

  const fetchEvaluations = async () => {
    let url = '/api/evaluations';
    if (user.role === 'faculty') {
      url += `?faculty_id=${user.ref_id}`;
    }
    const res = await fetch(url);
    setEvaluations(await res.json());
  };

  const fetchMarks = async (evalId: number) => {
    const res = await fetch(`/api/evaluations/${evalId}/marks`);
    setStudentMarks(await res.json());
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleCreateEval = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEval, faculty_id: user.ref_id })
    });
    if (res.ok) {
      setIsAdding(false);
      fetchEvaluations();
      setNewEval({
        title: '',
        max_marks: 100,
        type: 'Assignment',
        date: new Date().toISOString().split('T')[0],
        department_id: '',
        year: '1'
      });
    }
    setLoading(false);
  };

  const handleSaveMarks = async () => {
    if (!selectedEval) return;
    setLoading(true);
    const res = await fetch(`/api/evaluations/${selectedEval.id}/marks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marks: studentMarks })
    });
    if (res.ok) {
      alert('Marks updated successfully!');
      setSelectedEval(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Marks & Evaluations</h2>
          <p className="text-sm text-slate-500">Record and manage student performance</p>
        </div>
        {user.role === 'faculty' && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Evaluation</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-bold mb-4">Create New Evaluation</h3>
            <form onSubmit={handleCreateEval} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                placeholder="Evaluation Title (e.g. Midterm Exam)" 
                className="md:col-span-2 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newEval.title}
                onChange={e => setNewEval({ ...newEval, title: e.target.value })}
                required
              />
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newEval.type}
                onChange={e => setNewEval({ ...newEval, type: e.target.value as any })}
                required
              >
                <option value="Assignment">Assignment</option>
                <option value="Test">Test</option>
                <option value="Exam">Exam</option>
              </select>
              <input 
                type="number"
                placeholder="Max Marks" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newEval.max_marks}
                onChange={e => setNewEval({ ...newEval, max_marks: parseInt(e.target.value) || 0 })}
                required
              />
              <input 
                type="date"
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newEval.date}
                onChange={e => setNewEval({ ...newEval, date: e.target.value })}
                required
              />
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newEval.department_id}
                onChange={e => setNewEval({ ...newEval, department_id: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newEval.year}
                onChange={e => setNewEval({ ...newEval, year: e.target.value })}
                required
              >
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
              <div className="flex space-x-2 md:col-span-3">
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Evaluation'}
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedEval ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">{selectedEval.title}</h3>
              <p className="text-xs text-slate-500">{selectedEval.department_name} - Year {selectedEval.year} | Max Marks: {selectedEval.max_marks}</p>
            </div>
            <div className="flex space-x-2">
              {user.role === 'faculty' && (
                <button 
                  onClick={handleSaveMarks}
                  disabled={loading}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{loading ? 'Saving...' : 'Save All Marks'}</span>
                </button>
              )}
              <button onClick={() => setSelectedEval(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll Number</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marks Obtained</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {studentMarks.map((m, i) => (
                  <tr key={m.student_id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600 font-mono">{m.roll_number}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{m.student_name}</td>
                    <td className="px-6 py-4">
                      <input 
                        type="number"
                        max={selectedEval.max_marks}
                        min={0}
                        disabled={user.role === 'admin'}
                        className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                        value={m.marks_obtained || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          if (val > selectedEval.max_marks) return;
                          const newMarks = [...studentMarks];
                          newMarks[i].marks_obtained = isNaN(val) ? null : val;
                          setStudentMarks(newMarks);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-500">
                      {m.marks_obtained !== null ? `${Math.round((m.marks_obtained / selectedEval.max_marks) * 100)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map(e => (
            <div key={e.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  e.type === 'Exam' ? 'bg-rose-50 text-rose-600' : 
                  e.type === 'Test' ? 'bg-amber-50 text-amber-600' : 
                  'bg-indigo-50 text-indigo-600'
                }`}>
                  {e.type}
                </div>
                <p className="text-[10px] font-bold text-slate-400">{e.date}</p>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{e.title}</h3>
              <p className="text-xs text-slate-500 mb-4">{e.department_name} - Year {e.year}</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Max Marks</p>
                  <p className="text-sm font-bold text-slate-900">{e.max_marks}</p>
                </div>
                {(user.role === 'faculty' || user.role === 'admin') && (
                  <button 
                    onClick={() => {
                      setSelectedEval(e);
                      fetchMarks(e.id);
                    }}
                    className="flex items-center space-x-1 text-indigo-600 font-bold text-sm hover:underline"
                  >
                    <span>{user.role === 'admin' ? 'View Marks' : 'Manage Marks'}</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {evaluations.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 italic bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
              No evaluations found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
