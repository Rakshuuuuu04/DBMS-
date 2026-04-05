import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, FileBarChart, GraduationCap, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Faculty, FacultyAssignment } from '../types';

export const FacultyModule = ({ departments, onRefresh }: { departments: Department[], onRefresh: () => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FacultyAssignment | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({ faculty_id: '', name: '', email: '', department_id: '', password: '' });
  const [assignData, setAssignData] = useState({ faculty_id: '', department_id: '', year: '1', session: 'FN', session_time: '09:00 AM – 12:30 PM', subject: '' });
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    const [fRes, aRes] = await Promise.all([
      fetch('/api/faculty'),
      fetch('/api/faculty-assignments')
    ]);
    setFaculty(await fRes.json());
    setAssignments(await aRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingFaculty ? `/api/faculty/${editingFaculty.id}` : '/api/faculty';
    const method = editingFaculty ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setFormData({ faculty_id: '', name: '', email: '', department_id: '', password: '' });
      setIsAdding(false);
      setEditingFaculty(null);
      setSuccessMessage(editingFaculty ? 'Faculty updated successfully!' : 'Faculty added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
      onRefresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleEdit = (f: Faculty) => {
    setEditingFaculty(f);
    setFormData({
      faculty_id: f.faculty_id,
      name: f.name,
      email: f.email,
      department_id: f.department_id.toString(),
      password: ''
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this faculty member? This will remove all their assignments and evaluations.')) {
      const res = await fetch(`/api/faculty/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Faculty deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchData();
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingAssignment ? `/api/faculty-assignments/${editingAssignment.id}` : '/api/faculty-assignments';
    const method = editingAssignment ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignData)
    });
    if (res.ok) {
      setIsAssigning(false);
      setEditingAssignment(null);
      setAssignData({ faculty_id: '', department_id: '', year: '1', session: 'FN', session_time: '09:00 AM – 12:30 PM', subject: '' });
      setSuccessMessage(editingAssignment ? 'Assignment updated successfully!' : 'Assignment created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    }
  };

  const handleEditAssignment = (a: FacultyAssignment) => {
    setEditingAssignment(a);
    setAssignData({
      faculty_id: a.faculty_id.toString(),
      department_id: a.department_id.toString(),
      year: a.year.toString(),
      session: a.session,
      session_time: a.session_time,
      subject: a.subject
    });
    setIsAssigning(true);
  };

  const handleDeleteAssignment = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      const res = await fetch(`/api/faculty-assignments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Assignment deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchData();
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Faculty Management</h2>
        <div className="flex items-center space-x-3">
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
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                const filteredFaculty = faculty.filter(f => !selectedDept || f.department_name === selectedDept);
                const content = `
                  <html>
                    <head>
                      <title>Faculty Report - ${selectedDept || 'All Departments'}</title>
                      <style>
                        table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        h1 { font-family: sans-serif; }
                      </style>
                    </head>
                    <body>
                      <h1>Faculty Directory Report - ${selectedDept || 'All Departments'}</h1>
                      <table>
                        <thead>
                          <tr>
                            <th>Faculty ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${filteredFaculty.map(f => `
                            <tr>
                              <td>${f.faculty_id}</td>
                              <td>${f.name}</td>
                              <td>${f.email}</td>
                              <td>${f.department_name}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </body>
                  </html>
                `;
                printWindow.document.write(content);
                printWindow.document.close();
                printWindow.print();
              }
            }}
            className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-50 transition-colors"
          >
            <FileBarChart size={20} />
            <span>Generate Report</span>
          </button>
          <button 
						onClick={() => setIsAssigning(true)}
						className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-indigo-50 transition-colors"
					>
						<ChevronRight size={20} />
						<span>Assign Faculty</span>
					</button>
          <button 
            onClick={() => {
              setEditingFaculty(null);
              setFormData({ faculty_id: '', name: '', email: '', department_id: '', password: '' });
              setIsAdding(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-bold mb-4">{editingFaculty ? 'Edit Faculty Member' : 'New Faculty Member'}</h3>
            <form onSubmit={handleAddFaculty} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                placeholder="Faculty ID" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.faculty_id}
                onChange={e => setFormData({ ...formData, faculty_id: e.target.value })}
                required
              />
              <input 
                placeholder="Full Name" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input 
                type="email"
                placeholder="Email Address" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
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
              <input 
                type="password"
                placeholder={editingFaculty ? "New Password (leave blank to keep current)" : "Login Password"} 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required={!editingFaculty}
              />
              <div className="flex space-x-2 md:col-span-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium">
                  {editingFaculty ? 'Update Faculty' : 'Save Faculty'}
                </button>
                <button type="button" onClick={() => { setIsAdding(false); setEditingFaculty(null); }} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}

        {isAssigning && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-bold mb-4">{editingAssignment ? 'Edit Assignment' : 'Assign Faculty to Class'}</h3>
            <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={assignData.faculty_id}
                onChange={e => setAssignData({ ...assignData, faculty_id: e.target.value })}
                required
              >
                <option value="">Select Faculty</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={assignData.department_id}
                onChange={e => setAssignData({ ...assignData, department_id: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={assignData.year}
                onChange={e => setAssignData({ ...assignData, year: e.target.value })}
                required
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <select 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={assignData.session}
                onChange={e => {
                  const session = e.target.value;
                  const time = session === 'FN' ? '09:00 AM – 12:30 PM' : '01:30 PM – 04:30 PM';
                  setAssignData({ ...assignData, session: session as 'FN' | 'AN', session_time: time });
                }}
                required
              >
                <option value="FN">FN (Forenoon)</option>
                <option value="AN">AN (Afternoon)</option>
              </select>
              <input 
                placeholder="Session Time" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                value={assignData.session_time}
                readOnly
              />
              <input 
                placeholder="Subject Name" 
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={assignData.subject}
                onChange={e => setAssignData({ ...assignData, subject: e.target.value })}
                required
              />
              <div className="flex space-x-2 md:col-span-3">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium">
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </button>
                <button type="button" onClick={() => { setIsAssigning(false); setEditingAssignment(null); }} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <h3 className="font-bold text-slate-900">Faculty Directory</h3>
              <select 
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none bg-white font-bold text-slate-600"
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {faculty.filter(f => !selectedDept || f.department_name === selectedDept).length} Members
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-bottom border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {faculty
                  .filter(f => !selectedDept || f.department_name === selectedDept)
                  .map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{f.faculty_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                          {f.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{f.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{f.department_name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(f)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit Faculty"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(f.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Faculty"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {faculty.filter(f => !selectedDept || f.department_name === selectedDept).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No faculty found in this department.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Active Assignments</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {assignments.filter(a => !selectedDept || a.department_name === selectedDept).length} Assignments
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-bottom border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assignments
                  .filter(a => !selectedDept || a.department_name === selectedDept)
                  .map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{a.faculty_code}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{a.faculty_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{a.department_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">Year {a.year}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{a.subject}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${a.session === 'FN' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {a.session}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{a.session_time}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEditAssignment(a)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {assignments.filter(a => !selectedDept || a.department_name === selectedDept).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">No assignments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
