import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, Search, CheckCircle2, Clock, GraduationCap, RefreshCw, ShieldCheck, AlertCircle, BookOpen, UserCircle, TrendingUp, Bell, Activity, Users, FileBarChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Student, FacultyAssignment, Evaluation, Assignment, Submission } from '../types';

export const FacultyView = ({ user, activeTab }: { user: any, activeTab: string }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [facultyInfo, setFacultyInfo] = useState<any>(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: '',
    year: '',
    department_id: '',
    description: '',
    due_date: '',
    file_path: '',
    session: 'FN',
    max_marks: '100'
  });
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeData, setGradeData] = useState({ marks: '', feedback: '' });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [updateData, setUpdateData] = useState({ attendance: 0, marks: 0, present_sessions: 0, total_sessions: 0 });
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [viewingAssignmentId, setViewingAssignmentId] = useState<number | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<FacultyAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const fetchFacultyData = async () => {
    try {
      const [fRes, bRes] = await Promise.all([
        fetch(`/api/faculty/me/${user.ref_id}`),
        fetch(`/api/student-bookings?faculty_id=${user.ref_id}`)
      ]);
      if (fRes.ok) {
        const data = await fRes.json();
        setFacultyInfo(data);
        setCurrentOtp(data.attendance);
        if (data.last_assignment_id) {
          setSelectedAssignmentId(data.last_assignment_id.toString());
        }
      }
      if (bRes.ok) {
        setBookings(await bRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch faculty data", err);
    }
  };

  const fetchAssignedStudents = async () => {
    try {
      const res = await fetch(`/api/faculty/${user.ref_id}/assigned-students`);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`/api/faculty/${user.ref_id}/assignments`);
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const res = await fetch(`/api/evaluations`);
      const data = await res.json();
      setEvaluations(data.filter((e: any) => e.faculty_name.includes(user.email.split('@')[0])));
    } catch (err) {
      console.error("Failed to fetch evaluations", err);
    }
  };

  const fetchFacultyAssignments = async () => {
    try {
      const res = await fetch(`/api/assignments?faculty_id=${user.ref_id}`);
      if (res.ok) {
        setFacultyAssignments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/submissions?faculty_id=${user.ref_id}`);
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    }
  };

  const generateOtp = async () => {
    if (!selectedAssignmentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/${user.ref_id}/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: selectedAssignmentId })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentOtp(data.otp);
        setTimer(60);
        fetchAssignedStudents();
      }
    } catch (err) {
      console.error("OTP generation error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && currentOtp) {
      setCurrentOtp(null);
    }
    return () => clearInterval(interval);
  }, [timer, currentOtp]);

  useEffect(() => {
    if (user?.ref_id) {
      fetchAssignedStudents();
      fetchAssignments();
      fetchFacultyData();
      fetchEvaluations();
      fetchFacultyAssignments();
      fetchSubmissions();
    }
  }, [user.ref_id]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newAssignment,
        faculty_id: user.ref_id
      })
    });
    if (res.ok) {
      setShowCreateForm(false);
      setNewAssignment({ title: '', subject: '', year: '', department_id: '', description: '', due_date: '', file_path: '', session: 'FN', max_marks: '100' });
      fetchFacultyAssignments();
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    const res = await fetch(`/api/submissions/${gradingSubmission.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...gradeData, status: 'Graded' })
    });
    if (res.ok) {
      setGradingSubmission(null);
      setGradeData({ marks: '', feedback: '' });
      fetchSubmissions();
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    const res = await fetch(`/api/students/${editingStudent.id}/update-record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (res.ok) {
      setEditingStudent(null);
      fetchAssignedStudents();
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || s.department_name === deptFilter;
    return matchesSearch && matchesDept;
  });

  const avgAttendance = students.length > 0 
    ? Math.round(students.reduce((acc, s) => acc + (s.attendance || 0), 0) / students.length) 
    : 0;

  const attendanceTrend = [
    { name: 'Mon', rate: 85 },
    { name: 'Tue', rate: 88 },
    { name: 'Wed', rate: 92 },
    { name: 'Thu', rate: 84 },
    { name: 'Fri', rate: 90 },
  ];

  const performanceDist = [
    { name: '90%+', value: 12 },
    { name: '75-90%', value: 25 },
    { name: '60-75%', value: 18 },
    { name: '<60%', value: 5 },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Assigned Info Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Welcome, {facultyInfo?.name || 'Faculty'}</h2>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 flex items-center space-x-1">
                  <Activity size={12} className="mr-1" />
                  {facultyInfo?.department_name || 'No Department'}
                </span>
                {assignments.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 flex items-center space-x-1">
                    <ShieldCheck size={12} className="mr-1" />
                    Active Advisor
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Session</p>
              <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            <button onClick={() => { fetchFacultyData(); fetchAssignedStudents(); }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md rounded-2xl transition-all border border-slate-100">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+2 this week</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Classes</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{assignments.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Active</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Students</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{students.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Good</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Attendance</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{avgAttendance}%</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Action Required</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Evaluations</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            {evaluations.filter(e => e.marks_obtained === null).length}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Attendance Trends</h3>
              <select className="text-xs font-bold text-slate-400 uppercase bg-slate-50 border-none outline-none px-3 py-1.5 rounded-lg">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={4} dot={{r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Marks Distribution</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={performanceDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {performanceDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {performanceDist.map((d, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all text-center group">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Plus size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Create Task</p>
                </button>
                <button className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all text-center group">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Edit2 size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Upload Marks</p>
                </button>
                <button className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all text-center group">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Clock size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Start Session</p>
                </button>
                <button className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all text-center group">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <Bell size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Announce</p>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {[
                {title: 'Attendance marked for CSE-A', time: '2 hours ago', icon: CheckCircle2, color: 'text-emerald-500'},
                {title: 'New evaluation created', time: '5 hours ago', icon: Plus, color: 'text-indigo-500'},
                {title: 'Marks updated for Roll #102', time: 'Yesterday', icon: Edit2, color: 'text-amber-500'},
              ].map((act, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className={`mt-1 ${act.color}`}><act.icon size={16} /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{act.title}</p>
                    <p className="text-xs text-slate-400">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Need Help?</h3>
              <p className="text-indigo-100 text-sm mb-6">Check out our faculty guide for advanced features.</p>
              <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all">View Guide</button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10"><GraduationCap size={120} /></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6">My Assignments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(assignment => (
            <div key={assignment.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><BookOpen size={24} /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year {assignment.year}</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">{assignment.department_name}</h4>
              <p className="text-xs text-slate-500 mb-6">Year {assignment.year}</p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{i}</div>)}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">+12</div>
                </div>
                <button className="text-indigo-600 font-bold text-sm hover:underline">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (assignments.length > 0 && selectedAssignmentId) {
      const active = assignments.find(a => a.id.toString() === selectedAssignmentId);
      if (active) setActiveAssignment(active);
    }
  }, [assignments, selectedAssignmentId]);

  const renderAttendance = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><ShieldCheck size={20} /></div>
              <h2 className="text-xl font-bold text-slate-900">OTP Control</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Class Session</label>
                <select 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600"
                  value={selectedAssignmentId}
                  onChange={e => setSelectedAssignmentId(e.target.value)}
                  disabled={!!currentOtp}
                >
                  <option value="">Select Assignment</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.subject} ({a.session}) - {a.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed">Generate a secure OTP for students to mark their attendance for the selected session. Codes expire in 60 seconds.</p>
              
              {currentOtp ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 py-8 rounded-3xl border border-slate-100 text-center relative group">
                    <p className="text-5xl font-black text-indigo-600 tracking-[0.2em]">{currentOtp}</p>
                    <div className="absolute bottom-2 right-4 flex items-center space-x-1 text-xs font-bold text-slate-400"><Clock size={12} /><span>{timer}s left</span></div>
                    <button onClick={() => { navigator.clipboard.writeText(currentOtp || ''); alert('OTP copied to clipboard!'); }} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-indigo-500 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: '100%' }} animate={{ width: `${(timer / 60) * 100}%` }} transition={{ duration: 1, ease: 'linear' }} className={`h-full ${timer < 10 ? 'bg-red-500' : 'bg-indigo-600'}`} />
                  </div>
                  <button onClick={generateOtp} disabled={loading} className="w-full flex items-center justify-center space-x-2 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    <span>{loading ? 'Generating...' : 'Regenerate OTP'}</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={generateOtp} 
                  disabled={loading || !selectedAssignmentId} 
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
                  <span className="text-lg">{loading ? 'Generating...' : 'Start Session'}</span>
                </button>
              )}
            </div>
          </div>
          
          {activeAssignment && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Active Session Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-bold text-emerald-700">Live: {activeAssignment.subject}</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-black">{activeAssignment.session}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Session Time</p>
                    <p className="text-sm font-bold text-slate-900">{activeAssignment.session_time}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Booked Students</h3>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">
                    {bookings.filter(b => 
                      b.subject === activeAssignment.subject && 
                      b.session === activeAssignment.session &&
                      new Date(b.booking_date).toDateString() === new Date().toDateString()
                    ).length} Booked
                  </span>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {bookings
                    .filter(b => 
                      b.subject === activeAssignment.subject && 
                      b.session === activeAssignment.session &&
                      new Date(b.booking_date).toDateString() === new Date().toDateString()
                    )
                    .map(b => (
                      <div key={b.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black overflow-hidden shadow-sm">
                          <img src={`https://picsum.photos/seed/${b.student_id}/50/50`} alt="S" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{b.student_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">{b.student_id}</p>
                        </div>
                        <div className="ml-auto">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                        </div>
                      </div>
                    ))
                  }
                  {bookings.filter(b => 
                    b.subject === activeAssignment.subject && 
                    b.session === activeAssignment.session &&
                    new Date(b.booking_date).toDateString() === new Date().toDateString()
                  ).length === 0 && (
                    <p className="text-center py-8 text-xs text-slate-400 italic">No bookings for this session.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Attendance Statistics</h3>
          <div className="h-80 w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="rate" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-indigo-50 rounded-3xl"><p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Weekly Avg</p><h4 className="text-3xl font-black text-indigo-900">87.4%</h4></div>
            <div className="p-6 bg-emerald-50 rounded-3xl"><p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Best Day</p><h4 className="text-3xl font-black text-emerald-900">Wednesday</h4></div>
            <div className="p-6 bg-amber-50 rounded-3xl"><p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Low Attendance</p><h4 className="text-3xl font-black text-amber-900">Thursday</h4></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search by name or roll number..." className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <select className="flex-1 md:w-48 px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {Array.from(new Set(students.map(s => s.department_name))).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20} /></div>
        </div>
      </div>
      <AnimatePresence>
        {editingStudent && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div><h3 className="text-xl font-bold text-slate-900">Update Record: {editingStudent.name}</h3><p className="text-sm text-slate-500">Roll Number: {editingStudent.student_id}</p></div>
              <button onClick={() => setEditingStudent(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Present Sessions</label><input type="number" min="0" className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={updateData.present_sessions} onChange={e => { const present = parseInt(e.target.value) || 0; const total = updateData.total_sessions || 1; setUpdateData({ ...updateData, present_sessions: present, attendance: Math.round((present / total) * 100) }); }} required /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Sessions</label><input type="number" min="1" className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={updateData.total_sessions} onChange={e => { const total = parseInt(e.target.value) || 1; const present = updateData.present_sessions; setUpdateData({ ...updateData, total_sessions: total, attendance: Math.round((present / total) * 100) }); }} required /></div>
              <div className="flex space-x-3"><button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Changes</button><button type="button" onClick={() => setEditingStudent(null)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button></div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Info</th><th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th><th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Progress</th><th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5"><div className="flex items-center space-x-4"><div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-black">{student.name.charAt(0)}</div><div><p className="text-sm font-bold text-slate-900">{student.name}</p><p className="text-[10px] text-slate-500 font-mono tracking-tighter">{student.student_id}</p></div></div></td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-700">{student.department_name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Year {student.year}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5"><div className="flex items-center space-x-4"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[120px]"><motion.div initial={{ width: 0 }} animate={{ width: `${student.attendance}%` }} className={`h-full rounded-full ${(student.attendance || 0) > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} /></div><div className="text-right shrink-0"><span className="text-sm font-black text-slate-900">{student.attendance}%</span><p className="text-[10px] text-slate-400 font-bold">{student.present_sessions}/{student.total_sessions}</p></div></div></td>
                  <td className="px-8 py-5 text-right"><div className="flex items-center justify-end space-x-2"><button onClick={() => { setEditingStudent(student); setUpdateData({ attendance: student.attendance || 0, marks: student.marks || 0, present_sessions: student.present_sessions || 0, total_sessions: student.total_sessions || 0 }); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit Record"><Edit2 size={18} /></button><button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Profile"><ChevronRight size={18} /></button></div></td>
                </tr>
              ))}
              {filteredStudents.length === 0 && <tr><td colSpan={4} className="px-8 py-20 text-center"><div className="max-w-xs mx-auto"><Search size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-400 font-medium italic">No students found matching your search criteria.</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMarks = () => (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-slate-900">Marks & Grades Management</h3>
          <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center space-x-2"><Plus size={18} /><span>New Evaluation</span></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map(e => (
            <div key={e.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-4"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${e.type === 'Exam' ? 'bg-rose-50 text-rose-600' : e.type === 'Test' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{e.type}</span><span className="text-[10px] font-bold text-slate-400">{e.date}</span></div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{e.title}</h4>
              <p className="text-xs text-slate-500 mb-6">Max Marks: {e.max_marks}</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100"><div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">Completed</span></div><button className="text-indigo-600 font-bold text-sm hover:underline">Manage Marks</button></div>
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
          <h3 className="text-2xl font-black text-slate-900">Student Bookings</h3>
          <p className="text-slate-500">Students who have booked your slots for specific sessions</p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
          <Users size={18} />
          <span>{bookings.length} Total Bookings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100 overflow-hidden">
                <img src={`https://picsum.photos/seed/${booking.student_id}/100/100`} alt="Student" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{booking.student_name}</h4>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{booking.student_id}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</span>
                <span className="text-sm font-bold text-slate-700">{booking.subject}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session</span>
                <span className="text-sm font-bold text-indigo-600">{booking.session}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                <span className="text-sm font-bold text-slate-700">{new Date(booking.booking_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
                {booking.status}
              </span>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Activity size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">No student bookings found for your slots.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Academic Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
            <div className="flex items-center space-x-6"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><FileBarChart size={32} /></div><div><h4 className="text-lg font-bold text-slate-900">Attendance Report</h4><p className="text-sm text-slate-500">Monthly summary for all classes</p></div></div>
            <button className="p-3 text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight size={24} /></button>
          </div>
          <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
            <div className="flex items-center space-x-6"><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><TrendingUp size={32} /></div><div><h4 className="text-lg font-bold text-slate-900">Performance Analysis</h4><p className="text-sm text-slate-500">Student grade distribution</p></div></div>
            <button className="p-3 text-slate-400 hover:text-emerald-600 transition-all"><ChevronRight size={24} /></button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-900">Assignment Management</h3>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Assignment</span>
        </button>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xl font-bold text-slate-900">New Assignment</h4>
              <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={24} /></button>
            </div>
            <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Assigned Class / Subject</label>
                <select 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  onChange={e => {
                    const selected = assignments.find(a => a.id === parseInt(e.target.value));
                    if (selected) {
                      setNewAssignment({
                        ...newAssignment,
                        subject: selected.subject,
                        year: selected.year.toString(),
                        department_id: selected.department_id.toString(),
                        session: selected.session
                      });
                    }
                  }}
                  required
                >
                  <option value="">Choose from your assigned classes...</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.subject} - {a.department_name} (Year {a.year}) - {a.session}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignment Title</label>
                <input type="text" className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject (Auto-filled)</label>
                <input type="text" className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-slate-50" value={newAssignment.subject} readOnly required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Year (Auto-filled)</label>
                <input type="text" className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-slate-50" value={newAssignment.year ? `Year ${newAssignment.year}` : ''} readOnly required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</label>
                <input type="date" className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newAssignment.due_date} onChange={e => setNewAssignment({...newAssignment, due_date: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session (Auto-filled)</label>
                <input type="text" className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-slate-50" value={newAssignment.session} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maximum Marks</label>
                <input type="number" className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newAssignment.max_marks || 100} onChange={e => setNewAssignment({...newAssignment, max_marks: e.target.value})} required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attachment (Optional)</label>
                <input 
                  type="file" 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" 
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setNewAssignment({...newAssignment, file_path: e.target.files[0].name});
                    }
                  }}
                />
                <p className="text-[10px] text-slate-400 italic">Simulated upload: Only the filename will be stored.</p>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description / Instructions</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} required />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4">
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Publish Assignment</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h4 className="text-xl font-bold text-slate-900 mb-8">Created Assignments</h4>
          <div className="space-y-4">
            {facultyAssignments.map(a => (
              <div key={a.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">{a.subject}</span>
                    {a.session && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase">{a.session}</span>}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due: {a.due_date}</span>
                </div>
                <h5 className="text-lg font-bold text-slate-900 mb-2">{a.title}</h5>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{a.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.department_name} • Year {a.year}</p>
                  <button 
                    onClick={() => setViewingAssignmentId(a.id)}
                    className="text-indigo-600 font-bold text-xs hover:underline"
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            ))}
            {facultyAssignments.length === 0 && <p className="text-center py-12 text-slate-400 italic">No assignments created yet.</p>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-bold text-slate-900">
              {viewingAssignmentId 
                ? `Submissions: ${facultyAssignments.find(a => a.id === viewingAssignmentId)?.title}` 
                : 'All Submitted Assignments'}
            </h4>
            {viewingAssignmentId && (
              <button 
                onClick={() => setViewingAssignmentId(null)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Show All Submissions
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignment</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted File</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {submissions
                  .filter(sub => !viewingAssignmentId || sub.assignment_id === viewingAssignmentId)
                  .map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">{sub.student_name?.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{sub.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{sub.roll_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                        {facultyAssignments.find(a => a.id === sub.assignment_id)?.subject || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{sub.assignment_title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-indigo-600">
                        <FileBarChart size={14} />
                        <span className="text-xs font-medium truncate max-w-[120px]">{sub.file_path}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500">{new Date(sub.submission_date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${sub.status === 'Graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{sub.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setGradingSubmission(sub)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="View & Grade"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Download File"
                          onClick={() => alert(`Downloading ${sub.file_path}...`)}
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No submissions received yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gradingSubmission && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-2xl font-black text-slate-900">Review Submission</h4>
                <button onClick={() => setGradingSubmission(null)} className="text-slate-400 hover:text-slate-600">
                  <AlertCircle size={24} />
                </button>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Student Details</p>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg font-black">{gradingSubmission.student_name?.charAt(0)}</div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{gradingSubmission.student_name}</p>
                      <p className="text-xs text-slate-500 font-mono">Roll: {gradingSubmission.roll_number}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Student Comments</p>
                  <p className="text-sm text-indigo-900 italic leading-relaxed">
                    {gradingSubmission.comments ? `"${gradingSubmission.comments}"` : "No comments provided."}
                  </p>
                </div>

                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Submitted File</p>
                    <p className="text-sm font-bold text-emerald-900">{gradingSubmission.file_path}</p>
                  </div>
                  <button 
                    onClick={() => alert(`Downloading ${gradingSubmission.file_path}...`)}
                    className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <FileBarChart size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleGradeSubmission} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback Comment</label>
                  <textarea rows={4} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Add constructive feedback..." value={gradeData.feedback} onChange={e => setGradeData({...gradeData, feedback: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marks / Grade (Max: {gradingSubmission.max_marks || 100})</label>
                  <input type="number" min="0" max={gradingSubmission.max_marks || 100} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg" placeholder="Enter marks..." value={gradeData.marks} onChange={e => setGradeData({...gradeData, marks: e.target.value})} />
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 uppercase">Status</span>
                  <span className="text-xs font-black text-emerald-600">Graded</span>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={() => setGradingSubmission(null)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Feedback</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
          <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200">{user.email.charAt(0).toUpperCase()}</div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-black text-slate-900 mb-2">{user.email.split('@')[0]}</h3>
            <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-6">Senior Faculty • Computer Science</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p><p className="text-lg font-medium text-slate-900">{user.email}</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty ID</p><p className="text-lg font-medium text-slate-900">{user.ref_id}</p></div>
              </div>
              <div className="space-y-4">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p><p className="text-lg font-medium text-slate-900">Computer Science & Engineering</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined Date</p><p className="text-lg font-medium text-slate-900">August 12, 2021</p></div>
              </div>
            </div>
            <button className="mt-10 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Edit Profile Settings</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-12">
      {activeTab === 'faculty-dashboard' && renderDashboard()}
      {activeTab === 'faculty-classes' && renderClasses()}
      {activeTab === 'faculty-attendance' && renderAttendance()}
      {activeTab === 'faculty-students' && renderStudents()}
      {activeTab === 'faculty-marks' && renderMarks()}
      {activeTab === 'faculty-assignments' && renderAssignments()}
      {activeTab === 'faculty-reports' && renderReports()}
      {activeTab === 'faculty-bookings' && renderBookings()}
      {activeTab === 'faculty-profile' && renderProfile()}
    </div>
  );
};
