import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Student, Faculty } from '../types';

export const StudentModule = ({ departments, onRefresh }: { departments: Department[], onRefresh: () => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [filter, setFilter] = useState({ dept: '', year: '' });
  const [formData, setFormData] = useState({ student_id: '', name: '', email: '', department_id: '', year: '1', password: '' });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.dept) params.append('department_id', filter.dept);
      if (filter.year) params.append('year', filter.year);
      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      setStudents(data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFaculty = async () => {
    const res = await fetch('/api/faculty');
    const data = await res.json();
    setFaculty(data);
  };

  useEffect(() => {
    fetchStudents();
    fetchFaculty();
  }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
    const method = editingStudent ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setFormData({ student_id: '', name: '', email: '', department_id: '', year: '1', class_id: '', password: '' });
      setIsAdding(false);
      setEditingStudent(null);
      setSuccessMessage(editingStudent ? 'Student updated successfully!' : 'Student registered successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchStudents();
      onRefresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      department_id: student.department_id.toString(),
      year: student.year.toString(),
      password: '' // Don't pre-fill password for security
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Student deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchStudents();
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Students</h2>
        <div className="flex items-center space-x-4">
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-100"
            >
              {successMessage}
            </motion.div>
          )}
          <button 
            onClick={() => {
              setEditingStudent(null);
              setFormData({ student_id: '', name: '', email: '', department_id: '', year: '1', password: '' });
              setIsAdding(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-bold mb-4">{editingStudent ? 'Edit Student Details' : 'New Student Registration'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input 
                placeholder="Roll Number" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.student_id}
                onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                required
              />
              <input 
                placeholder="Name" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input 
                type="text"
                placeholder="Email / Username" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <input 
                type="password"
                placeholder={editingStudent ? "New Password (leave blank to keep current)" : "Password"} 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required={!editingStudent}
              />
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.department_id}
                onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
                required
              >
                <option value="">Select Year</option>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="flex space-x-2 md:col-span-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium">
                  {editingStudent ? 'Update Student' : 'Register Student'}
                </button>
                <button type="button" onClick={() => { setIsAdding(false); setEditingStudent(null); }} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2 text-slate-500">
          <Search size={18} />
          <span className="text-sm font-medium">Filter by:</span>
        </div>
        <select 
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none"
          value={filter.dept}
          onChange={e => setFilter({ ...filter, dept: e.target.value })}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select 
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none"
          value={filter.year}
          onChange={e => setFilter({ ...filter, year: e.target.value })}
        >
          <option value="">All Years</option>
          {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-bottom border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll Number</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email / Username</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center space-x-2 text-slate-400">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{student.student_id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.department_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                        Year {student.year}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(student)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit Student"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">No students found matching filters.</td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
