import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, GraduationCap, Trophy, Award, Activity, BookOpen, Calendar, UserCheck, Trash2, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Evaluation, Assignment, Submission, Faculty } from '../types';

export const StudentView = ({ user, activeTab }: { user: any, activeTab: string }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [otp, setOtp] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionData, setSubmissionData] = useState({ comments: '', file_path: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const [defaultFaculty, setDefaultFaculty] = useState<any>(null);
  const [allFaculty, setAllFaculty] = useState<Faculty[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({ faculty_id: '', subject: '', session: 'FN', booking_date: new Date().toISOString().split('T')[0] });

  const fetchMyData = async () => {
    const [sRes, aRes, eRes, hRes, asRes, nRes, fRes, bRes] = await Promise.all([
      fetch(`/api/students/me/${user.ref_id}`),
      fetch(`/api/students/${user.ref_id}/active-sessions`),
      fetch(`/api/evaluations?student_id=${user.ref_id}`),
      fetch(`/api/students/${user.ref_id}/attendance-history`),
      fetch(`/api/assignments?student_id=${user.ref_id}`),
      fetch(`/api/notifications?student_id=${user.ref_id}`),
      fetch('/api/faculty'),
      fetch(`/api/student-bookings?student_id=${user.ref_id}`)
    ]);
    const studentData = await sRes.json();
    const sessions = await aRes.json();
    setStudent(studentData);
    setActiveSessions(sessions);
    setEvaluations(await eRes.json());
    setAttendanceHistory(await hRes.json());
    setAssignments(await asRes.json());
    setNotifications(await nRes.json());
    setAllFaculty(await fRes.json());
    setBookings(await bRes.json());
    
    if (studentData.department_id) {
      const dfRes = await fetch(`/api/departments/${studentData.department_id}/default-faculty`);
      if (dfRes.ok) {
        setDefaultFaculty(await dfRes.json());
      }
    }
    
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].assignment_id.toString());
    }
  };

  useEffect(() => {
    fetchMyData();
  }, [user.ref_id]);

  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      setMessage({ type: 'error', text: 'Please select a session' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/students/${user.ref_id}/submit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, assignment_id: selectedSessionId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Attendance marked successfully!' });
        setOtp('');
        fetchMyData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit OTP' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!student) return <div className="p-12 text-center text-slate-400">Loading your profile...</div>;

  const sgpaData = [
    { name: 'Sem 1', value: 8.1 },
    { name: 'Sem 2', value: 8.0 },
    { name: 'Sem 3', value: 8.2 },
    { name: 'Sem 4', value: 7.8 },
    { name: 'Sem 5', value: 7.9 },
    { name: 'Sem 6', value: 8.3 },
  ].filter((_, i) => i < (student.year === 1 ? 1 : student.year === 2 ? 2 : student.year === 3 ? 4 : 6));

  const cgpaTrend = [
    { name: 'Sem 1', value: 8.1 },
    { name: 'Sem 2', value: 8.05 },
    { name: 'Sem 3', value: 8.1 },
    { name: 'Sem 4', value: 8.02 },
    { name: 'Sem 5', value: 8.0 },
    { name: 'Sem 6', value: 8.05 },
  ].filter((_, i) => i < (student.year === 1 ? 1 : student.year === 2 ? 2 : student.year === 3 ? 4 : 6));

  const subjectPerformance = [
    { subject: 'Math', score: 85 },
    { subject: 'Physics', score: 78 },
    { subject: 'CS', score: 92 },
    { subject: 'English', score: 88 },
    { subject: 'Lab', score: 95 },
  ];

  const semesterMarks = [
    { semester: 1, subjects: [
      { name: 'Mathematics I', internal: 24, external: 68, total: 92, grade: 'O' },
      { name: 'Physics', internal: 22, external: 62, total: 84, grade: 'A+' },
      { name: 'Programming in C', internal: 25, external: 70, total: 95, grade: 'O' },
      { name: 'Engineering Graphics', internal: 21, external: 58, total: 79, grade: 'A' },
    ]},
    { semester: 2, subjects: [
      { name: 'Mathematics II', internal: 23, external: 65, total: 88, grade: 'A+' },
      { name: 'Chemistry', internal: 20, external: 60, total: 80, grade: 'A' },
      { name: 'Data Structures', internal: 24, external: 66, total: 90, grade: 'O' },
      { name: 'Digital Logic', internal: 22, external: 64, total: 86, grade: 'A+' },
    ]},
    { semester: 3, subjects: [
      { name: 'Discrete Math', internal: 24, external: 68, total: 92, grade: 'O' },
      { name: 'Java Programming', internal: 25, external: 72, total: 97, grade: 'O' },
      { name: 'Computer Org', internal: 21, external: 55, total: 76, grade: 'B+' },
      { name: 'Operating Systems', internal: 23, external: 62, total: 85, grade: 'A+' },
    ]},
    { semester: 4, subjects: [
      { name: 'Algorithms', internal: 24, external: 65, total: 89, grade: 'A+' },
      { name: 'Database Systems', internal: 22, external: 68, total: 90, grade: 'O' },
      { name: 'Software Eng', internal: 21, external: 60, total: 81, grade: 'A' },
      { name: 'Theory of Comp', internal: 23, external: 58, total: 81, grade: 'A' },
    ]},
    { semester: 5, subjects: [
      { name: 'Computer Networks', internal: 24, external: 62, total: 86, grade: 'A+' },
      { name: 'Web Tech', internal: 25, external: 70, total: 95, grade: 'O' },
      { name: 'AI', internal: 22, external: 64, total: 86, grade: 'A+' },
      { name: 'Compiler Design', internal: 21, external: 55, total: 76, grade: 'B+' },
    ]},
    { semester: 6, subjects: [
      { name: 'Cloud Computing', internal: 24, external: 68, total: 92, grade: 'O' },
      { name: 'Mobile App Dev', internal: 25, external: 72, total: 97, grade: 'O' },
      { name: 'Cyber Security', internal: 21, external: 60, total: 81, grade: 'A' },
      { name: 'Big Data', internal: 23, external: 62, total: 85, grade: 'A+' },
    ]},
  ];

  const currentCGPA = (sgpaData.reduce((acc, curr) => acc + curr.value, 0) / sgpaData.length).toFixed(2);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/student-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bookingData, student_id: user.ref_id })
    });
    if (res.ok) {
      setShowBookingForm(false);
      fetchMyData();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleBookingDelete = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    const res = await fetch(`/api/student-bookings/${id}`, { method: 'DELETE' });
    if (res.ok) fetchMyData();
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Default Faculty Banner */}
      {defaultFaculty && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10"><UserCheck size={120} /></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">Department Default Faculty</p>
              <h3 className="text-3xl font-black">{defaultFaculty.faculty_name}</h3>
              <p className="text-indigo-100 mt-1 font-medium">Assigned for general attendance and queries</p>
            </div>
            <button 
              onClick={() => setShowBookingForm(true)}
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center space-x-2 w-fit"
            >
              <Calendar size={20} />
              <span>Book Faculty Slot</span>
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Activity size={24} /></div><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">On Track</span></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Attendance Percentage</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{student.attendance}%</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">85% Done</span></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Assignment Completion</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">12/14</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4"><div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><AlertCircle size={24} /></div><span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Clear</span></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Backlog / Arrear Count</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">0</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Trophy size={24} /></div><span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Top 5%</span></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Academic Rank</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">#12</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-8"><div><h3 className="text-xl font-bold text-slate-900">SGPA Progress Chart</h3><p className="text-sm text-slate-500">Completed semesters only</p></div><div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-xs font-bold text-slate-400 uppercase">GPA per Semester</span></div></div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sgpaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={[0, 10]} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} itemStyle={{color: '#1e293b'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Award size={120} /></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Cumulative CGPA</p>
          <div className="relative">
            <svg className="w-48 h-48"><circle className="text-slate-100" strokeWidth="12" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" /><circle className="text-indigo-500" strokeWidth="12" strokeDasharray={502} strokeDashoffset={502 - (502 * parseFloat(currentCGPA)) / 10} strokeLinecap="round" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" /></svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-5xl font-black text-slate-900">{currentCGPA}</span><span className="text-xs font-bold text-slate-500 uppercase">Cumulative</span></div>
          </div>
          <p className="mt-8 text-sm text-slate-400 font-medium">Based on {sgpaData.length} completed semesters</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col relative overflow-hidden">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Notifications</h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
            {notifications.length > 0 ? notifications.map((n) => (
              <div key={n.id} className={`p-4 rounded-2xl border ${n.is_read ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/50 border-indigo-100'} transition-all`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{n.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[9px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1" />}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Activity size={32} className="mb-2 opacity-20" />
                <p className="text-xs italic">No new notifications</p>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-1 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Subject Performance</h3>
          <div className="space-y-6">
            {subjectPerformance.map((sub, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm"><span className="font-bold text-slate-700">{sub.subject}</span><span className="font-black text-indigo-600">{sub.score}%</span></div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${sub.score}%` }} className="h-full bg-indigo-500" /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8">CGPA Growth Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cgpaTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={[7, 9]} />
                <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} itemStyle={{color: '#1e293b'}} />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} dot={{r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8">
      <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5"><GraduationCap size={200} /></div>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12 relative z-10">
          <div className="relative">
            <div className="w-40 h-40 rounded-[3rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-500/20 overflow-hidden border-4 border-white"><img src={`https://picsum.photos/seed/${student.student_id}/200/200`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>
            <div className="absolute -bottom-2 -right-2 p-3 bg-emerald-500 text-white rounded-2xl shadow-xl border-4 border-white"><CheckCircle2 size={20} /></div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"><div><h3 className="text-4xl font-black text-slate-900 mb-2">{student.name}</h3><p className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-sm">Register No: {student.student_id}</p></div><div className="mt-4 md:mt-0 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-bold uppercase tracking-widest">Status: Continuing</div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Department</p><p className="text-xl font-bold text-slate-800">{student.department_name}</p></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Current Semester</p><p className="text-xl font-bold text-slate-800">Semester {student.year * 2}</p></div></div>
              <div className="space-y-6"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Academic Mentor</p><div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{student.faculty_name?.charAt(0) || 'M'}</div><p className="text-xl font-bold text-slate-800">{student.faculty_name || 'Prof. Sarah Johnson'}</p></div></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Academic Year</p><p className="text-xl font-bold text-slate-800">Year {student.year}</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-8">
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div><h3 className="text-2xl font-black text-slate-900">Daily Attendance Entry</h3><p className="text-slate-500 mt-2">Select session and enter OTP provided by faculty.</p></div>
        <form onSubmit={handleSubmitOtp} className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <select 
            className="w-full md:w-48 px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600"
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            required
          >
            <option value="">Select Session</option>
            {activeSessions.map(s => (
              <option key={s.assignment_id} value={s.assignment_id}>
                {s.subject} ({s.session})
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <input type="text" placeholder="000000" maxLength={6} className="flex-1 md:w-48 px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center text-2xl tracking-[0.5em] text-slate-900" value={otp} onChange={e => setOtp(e.target.value)} required />
            <button type="submit" disabled={submitting || !selectedSessionId} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50">{submitting ? 'Verifying...' : 'Submit OTP'}</button>
          </div>
        </form>
      </div>
      {message && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 rounded-[2rem] border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'} flex items-center space-x-4`}>{message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}<span className="font-bold text-lg">{message.text}</span></motion.div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Attendance Summary</h3>
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Percentage</p>
              <h4 className="text-6xl font-black text-slate-900">{student.attendance}%</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Present</p>
                <p className="text-2xl font-black text-slate-900">{student.present_sessions}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
                <p className="text-2xl font-black text-slate-900">{student.total_sessions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Attendance History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">FN Session</th>
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">AN Session</th>
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Daily Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendanceHistory.map((record, i) => (
                  <tr key={i} className="group">
                    <td className="py-4 text-sm font-bold text-slate-600">{record.date}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        record.fn_status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 
                        record.fn_status === 'Absent' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {record.fn_status || 'No Session'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        record.an_status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 
                        record.an_status === 'Absent' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {record.an_status || 'No Session'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-sm font-black text-slate-900">{record.total}</span>
                    </td>
                  </tr>
                ))}
                {attendanceHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 italic">No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademics = () => (
    <div className="space-y-8">
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center justify-between mb-10"><div><h3 className="text-2xl font-black text-slate-900">Semester Marks Section</h3><p className="text-sm text-slate-500">Academic performance breakdown</p></div><div className="flex items-center space-x-4"><span className="text-xs font-bold text-slate-500 uppercase">Academic Year: {student.year}</span><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><BookOpen size={20} /></div></div></div>
        <div className="space-y-12">
          {semesterMarks.filter(sem => {
            if (student.year === 1) return sem.semester <= 1;
            if (student.year === 2) return sem.semester <= 2;
            if (student.year === 3) return sem.semester <= 4;
            return sem.semester <= 6;
          }).map(sem => (
            <div key={sem.semester} className="space-y-6">
              <div className="flex items-center space-x-4"><div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-slate-100">{sem.semester}</div><h4 className="text-xl font-bold text-slate-900">Semester {sem.semester}</h4><div className="flex-1 h-px bg-slate-100" /></div>
              <div className="overflow-hidden rounded-[2rem] border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50"><th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject Name</th><th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Internal Marks</th><th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">External Marks</th><th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Marks</th><th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Grade</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">{sem.subjects.map((sub, i) => (<tr key={i} className="hover:bg-slate-50/50 transition-colors"><td className="px-8 py-4 text-sm font-bold text-slate-900">{sub.name}</td><td className="px-8 py-4 text-sm font-medium text-slate-500">{sub.internal}</td><td className="px-8 py-4 text-sm font-medium text-slate-500">{sub.external}</td><td className="px-8 py-4 text-sm font-black text-indigo-600">{sub.total}</td><td className="px-8 py-4 text-right"><span className={`px-3 py-1 rounded-lg font-black text-xs ${sub.grade === 'O' ? 'bg-emerald-50 text-emerald-600' : sub.grade === 'A+' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{sub.grade}</span></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || !selectedFile) return;
    setSubmitting(true);
    try {
      // In a real app, we would use FormData to upload the actual file
      // For this demo, we'll simulate the upload and store the filename
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: submittingAssignment.id,
          student_id: user.ref_id,
          comments: submissionData.comments,
          file_path: selectedFile.name // Using the real filename for display
        })
      });
      if (res.ok) {
        setSubmittingAssignment(null);
        setSubmissionData({ comments: '', file_path: '' });
        setSelectedFile(null);
        fetchMyData();
      }
    } catch (err) {
      console.error("Submission error", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|zip)$/i)) {
      alert('Invalid file format. Supported formats: PDF, DOC, DOCX, ZIP');
      return;
    }

    if (file.size > maxSize) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const renderAssignments = () => (
    <div className="space-y-8">
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 mb-8">My Assignments & Tasks</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="overflow-hidden rounded-[2rem] border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assignment</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due Date</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Marks</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assignments.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-900">{task.title}</p>
                      <p className="text-[10px] text-slate-400 mb-2">By {task.faculty_name}</p>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs line-clamp-2 hover:line-clamp-none transition-all cursor-help" title={task.description}>
                          {task.description}
                        </p>
                      )}
                      {task.file_path && (
                        <div className="mt-2 flex items-center space-x-2">
                          <BookOpen size={12} className="text-indigo-500" />
                          <button 
                            onClick={() => alert(`Downloading faculty attachment: ${task.file_path}`)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline"
                          >
                            Download Attachment
                          </button>
                        </div>
                      )}
                      {task.submission_status && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[10px] text-indigo-600 font-medium">File: {task.submission_file_path}</p>
                          {task.submission_date && (
                            <p className="text-[10px] text-slate-400">Submitted: {new Date(task.submission_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-600">{task.subject}</span>
                      {task.session && <p className="text-[10px] text-slate-400 uppercase font-bold">{task.session}</p>}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-medium text-slate-500">
                        {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-medium text-slate-500">{task.due_date}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-900">{task.max_marks || 100}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-xl border ${
                        task.submission_status === 'Graded' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        task.submission_status === 'Submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {task.submission_status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {task.submission_status === 'Graded' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-emerald-600">{task.marks || '0'} / {task.max_marks || 100}</span>
                          <button 
                            onClick={() => setSubmittingAssignment(task)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline mt-1"
                          >
                            View Review
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSubmittingAssignment(task)}
                          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                          {task.submission_status === 'Submitted' ? 'Update' : 'Submit Now'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assignments.length === 0 && <p className="text-center py-12 text-slate-400 italic">No assignments assigned yet.</p>}
          </div>
        </div>
      </div>

      {submittingAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-black text-slate-900">
                {submittingAssignment.submission_status === 'Graded' ? 'Assignment Result' : 'Submit Assignment'}
              </h4>
              <button onClick={() => { setSubmittingAssignment(null); setSelectedFile(null); }} className="text-slate-400 hover:text-slate-600">
                <AlertCircle size={24} />
              </button>
            </div>

            {submittingAssignment.submission_status === 'Graded' ? (
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Assignment Details</p>
                  <h5 className="text-lg font-bold text-slate-900">{submittingAssignment.title}</h5>
                  <p className="text-xs text-indigo-600 font-bold uppercase mt-1">{submittingAssignment.subject}</p>
                </div>

                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Faculty Review</p>
                  <p className="text-sm text-indigo-900 italic leading-relaxed">"{submittingAssignment.feedback}"</p>
                  <div className="mt-6 pt-6 border-t border-indigo-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Final Marks</span>
                    <span className="text-3xl font-black text-indigo-600">{submittingAssignment.marks || '0'} / {submittingAssignment.max_marks || 100}</span>
                  </div>
                </div>

                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Submission Details</p>
                  <p className="text-sm font-bold text-emerald-900">{submittingAssignment.submission_file_path}</p>
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] text-emerald-600">
                      Submitted on: {submittingAssignment.submission_date ? new Date(submittingAssignment.submission_date).toLocaleDateString() : 'N/A'}
                    </p>
                    {submittingAssignment.review_date && (
                      <p className="text-[10px] text-emerald-600">
                        Graded on: {new Date(submittingAssignment.review_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-[10px] text-emerald-600 font-bold">Status: Graded</p>
                  </div>
                </div>

                <button onClick={() => setSubmittingAssignment(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">Close</button>
              </div>
            ) : (
              <form onSubmit={handleAssignmentSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comments (Optional)</label>
                  <textarea rows={3} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Add any notes for the faculty..." value={submissionData.comments} onChange={e => setSubmissionData({...submissionData, comments: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload File (PDF, DOC, DOCX, ZIP)</label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative ${
                      dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.zip" />
                    <BookOpen className={`mx-auto mb-2 ${selectedFile ? 'text-indigo-600' : 'text-slate-300'}`} size={32} />
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 truncate px-4">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mt-2">Ready to submit</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-slate-500">Click to select or drag and drop</p>
                        <p className="text-[10px] text-slate-400 mt-1">Max file size: 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={() => { setSubmittingAssignment(null); setSelectedFile(null); }} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" disabled={submitting || !selectedFile} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Work'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-8">
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 mb-8">Achievements & Certifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Dean\'s List 2023', issuer: 'EduTrack University', date: 'Sept 2023', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
            { title: 'Hackathon Winner', issuer: 'TechFest 2023', date: 'Aug 2023', icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { title: 'Python Specialist', issuer: 'Coursera', date: 'June 2023', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-[2rem] border border-slate-100 bg-white text-center group hover:bg-slate-50 transition-all">
              <div className={`w-16 h-16 mx-auto mb-6 ${item.bg} rounded-[1.5rem] flex items-center justify-center ${item.color} shadow-sm border border-slate-50`}><item.icon size={32} /></div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
              <p className="text-xs text-slate-500 mb-4">{item.issuer}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900">Faculty Bookings</h3>
          <p className="text-slate-500">Manage your optional faculty slot bookings</p>
        </div>
        <button 
          onClick={() => setShowBookingForm(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Booking</span>
        </button>
      </div>

      <AnimatePresence>
        {showBookingForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl mx-auto"
          >
            <h4 className="text-xl font-bold text-slate-900 mb-6">Book Faculty Slot</h4>
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Faculty</label>
                  <select 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600"
                    value={bookingData.faculty_id}
                    onChange={e => setBookingData({ ...bookingData, faculty_id: e.target.value })}
                    required
                  >
                    <option value="">Select Faculty</option>
                    {allFaculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.department_name})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600"
                    placeholder="e.g. Data Structures"
                    value={bookingData.subject}
                    onChange={e => setBookingData({ ...bookingData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session</label>
                  <select 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600"
                    value={bookingData.session}
                    onChange={e => setBookingData({ ...bookingData, session: e.target.value })}
                    required
                  >
                    <option value="FN">Forenoon (FN)</option>
                    <option value="AN">Afternoon (AN)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600"
                    value={bookingData.booking_date}
                    onChange={e => setBookingData({ ...bookingData, booking_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
                  Confirm Booking
                </button>
                <button type="button" onClick={() => setShowBookingForm(false)} className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative group">
            <button 
              onClick={() => handleBookingDelete(booking.id)}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session</p>
                <p className="text-lg font-black text-slate-900">{booking.session}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</p>
                <p className="text-sm font-bold text-slate-700">{booking.subject}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty</p>
                <p className="text-sm font-bold text-indigo-600">{booking.faculty_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                <p className="text-sm font-bold text-slate-700">{new Date(booking.booking_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${
                booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {booking.status}
              </span>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">No active bookings found.</p>
            <button onClick={() => setShowBookingForm(true)} className="mt-4 text-indigo-600 font-bold hover:underline">Book your first slot</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-8">
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 mb-8">Academic Results Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6"><h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">SGPA Trend per Semester</h4><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={sgpaData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={[0, 10]} /><Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9'}} itemStyle={{color: '#1e293b'}} /><Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
          <div className="space-y-6"><h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">CGPA Growth Over Time</h4><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={cgpaTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={[7, 9]} /><Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9'}} itemStyle={{color: '#1e293b'}} /><Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} /></LineChart></ResponsiveContainer></div></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-12">
      {activeTab === 'student-dashboard' && renderDashboard()}
      {activeTab === 'student-profile' && renderProfile()}
      {activeTab === 'student-attendance' && renderAttendance()}
      {activeTab === 'student-academics' && renderAcademics()}
      {activeTab === 'student-assignments' && renderAssignments()}
      {activeTab === 'student-achievements' && renderAchievements()}
      {activeTab === 'student-bookings' && renderBookings()}
      {activeTab === 'student-results' && renderResults()}
    </div>
  );
};
