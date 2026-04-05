import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserSquare2, 
  FileBarChart, 
  LogOut, 
  Edit2, 
  GraduationCap,
  Calendar,
  BookOpen,
  UserCircle,
  Clock,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { motion } from 'motion/react';
import { Department, DashboardStats } from './types';
import { SidebarItem } from './components/Common';
import { AdminDashboard } from './components/AdminDashboard';
import { DepartmentModule } from './components/DepartmentModule';
import { StudentModule } from './components/StudentModule';
import { FacultyModule } from './components/FacultyModule';
import { FacultyView } from './components/FacultyView';
import { StudentView } from './components/StudentView';
import { ReportsModule } from './components/ReportsModule';
import { MarksModule } from './components/MarksModule';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    });
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      if (userData.role === 'admin') setActiveTab('dashboard');
      else if (userData.role === 'faculty') setActiveTab('faculty-dashboard');
      else setActiveTab('student-dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  const refreshData = async () => {
    if (!user) return;
    if (user.role === 'admin') {
      const [sRes, dRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/departments')
      ]);
      setStats(await sRes.json());
      setDepartments(await dRes.json());
    } else if (user.role === 'faculty') {
      const dRes = await fetch('/api/departments');
      setDepartments(await dRes.json());
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mx-auto mb-4">
              <GraduationCap className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900">EduTrack Login</h1>
            <p className="text-slate-500 text-sm mt-1">Digital Process Monitoring System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="admin@gmail.com"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
              Sign In
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Demo Credentials</p>
            <div className="space-y-1">
              <p className="text-[11px] text-slate-600"><span className="font-bold">Admin:</span> admin@gmail.com / admin123</p>
              <p className="text-[11px] text-slate-600"><span className="font-bold">Faculty:</span> faculty@gmail.com / faculty123</p>
              <p className="text-[11px] text-slate-600"><span className="font-bold">Student:</span> student@gmail.com / student123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className={`w-64 border-r p-6 flex flex-col ${user.role === 'student' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h1 className={`text-xl font-black tracking-tight ${user.role === 'student' ? 'text-white' : 'text-slate-900'}`}>EduTrack</h1>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{user.role} Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {user.role === 'admin' && (
            <>
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <SidebarItem icon={Building2} label="Departments" active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />
              <SidebarItem icon={Users} label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
              <SidebarItem icon={UserSquare2} label="Faculty" active={activeTab === 'faculty'} onClick={() => setActiveTab('faculty')} />
              <SidebarItem icon={Edit2} label="Marks & Grades" active={activeTab === 'marks'} onClick={() => setActiveTab('marks')} />
              <SidebarItem icon={FileBarChart} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
            </>
          )}
          {user.role === 'faculty' && (
            <>
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'faculty-dashboard'} onClick={() => setActiveTab('faculty-dashboard')} />
              <SidebarItem icon={BookOpen} label="My Assignments" active={activeTab === 'faculty-classes'} onClick={() => setActiveTab('faculty-classes')} />
              <SidebarItem icon={Clock} label="Attendance" active={activeTab === 'faculty-attendance'} onClick={() => setActiveTab('faculty-attendance')} />
              <SidebarItem icon={Users} label="Students" active={activeTab === 'faculty-students'} onClick={() => setActiveTab('faculty-students')} />
              <SidebarItem icon={CheckCircle2} label="Assignments" active={activeTab === 'faculty-assignments'} onClick={() => setActiveTab('faculty-assignments')} />
              <SidebarItem icon={Edit2} label="Marks & Grades" active={activeTab === 'faculty-marks'} onClick={() => setActiveTab('faculty-marks')} />
              <SidebarItem icon={FileBarChart} label="Reports" active={activeTab === 'faculty-reports'} onClick={() => setActiveTab('faculty-reports')} />
              <SidebarItem icon={Calendar} label="Bookings" active={activeTab === 'faculty-bookings'} onClick={() => setActiveTab('faculty-bookings')} />
              <SidebarItem icon={UserCircle} label="Profile" active={activeTab === 'faculty-profile'} onClick={() => setActiveTab('faculty-profile')} />
            </>
          )}
          {user.role === 'student' && (
            <>
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'student-dashboard'} onClick={() => setActiveTab('student-dashboard')} dark />
              <SidebarItem icon={UserCircle} label="Profile" active={activeTab === 'student-profile'} onClick={() => setActiveTab('student-profile')} dark />
              <SidebarItem icon={Clock} label="Attendance" active={activeTab === 'student-attendance'} onClick={() => setActiveTab('student-attendance')} dark />
              <SidebarItem icon={Calendar} label="Bookings" active={activeTab === 'student-bookings'} onClick={() => setActiveTab('student-bookings')} dark />
              <SidebarItem icon={BookOpen} label="Academics" active={activeTab === 'student-academics'} onClick={() => setActiveTab('student-academics')} dark />
              <SidebarItem icon={CheckCircle2} label="Assignments" active={activeTab === 'student-assignments'} onClick={() => setActiveTab('student-assignments')} dark />
              <SidebarItem icon={Trophy} label="Achievements" active={activeTab === 'student-achievements'} onClick={() => setActiveTab('student-achievements')} dark />
              <SidebarItem icon={FileBarChart} label="Results" active={activeTab === 'student-results'} onClick={() => setActiveTab('student-results')} dark />
            </>
          )}
        </nav>

        <div className={`mt-auto pt-6 border-t ${user.role === 'student' ? 'border-slate-800' : 'border-slate-100'}`}>
          <button 
            onClick={() => setUser(null)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${user.role === 'student' ? 'text-slate-400 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto bg-slate-50">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black capitalize tracking-tight text-slate-900">
              {activeTab.split('-').pop()?.replace('view', 'Dashboard')}
            </h2>
            <p className="text-slate-500 font-medium">Welcome back, {user.email.split('@')[0]}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-bold capitalize text-slate-900">{user.role}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl border-2 shadow-sm overflow-hidden ${user.role === 'student' ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-white'}`}>
              <img src={`https://picsum.photos/seed/${user.role}/100/100`} alt="User" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && <AdminDashboard stats={stats} onRefresh={refreshData} />}
          {activeTab === 'departments' && <DepartmentModule departments={departments} onRefresh={refreshData} />}
          {activeTab === 'students' && <StudentModule departments={departments} onRefresh={refreshData} />}
          {activeTab === 'faculty' && <FacultyModule departments={departments} onRefresh={refreshData} />}
          {activeTab === 'reports' && <ReportsModule stats={stats} />}
          {activeTab === 'marks' && <MarksModule user={user} departments={departments} />}
          
          {activeTab.startsWith('faculty-') && <FacultyView user={user} activeTab={activeTab} />}

          {activeTab.startsWith('student-') && <StudentView user={user} activeTab={activeTab} />}
        </motion.div>
      </main>
    </div>
  );
}
