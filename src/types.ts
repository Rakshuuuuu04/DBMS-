export interface Department {
  id: number;
  code: string;
  name: string;
  student_count?: number;
}

export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department_id: number;
  department_name?: string;
  year: number;
  attendance?: number;
  present_sessions?: number;
  total_sessions?: number;
  marks?: number;
  faculty_id?: number;
  faculty_name?: string;
}

export interface Faculty {
  id: number;
  faculty_id: string;
  name: string;
  email: string;
  department_id: number;
  department_name?: string;
  assigned_year?: number;
}

export interface FacultyAssignment {
  id: number;
  faculty_id: number;
  faculty_name?: string;
  faculty_code?: string;
  faculty_email?: string;
  department_id: number;
  department_name?: string;
  year: number;
  session: 'FN' | 'AN';
  session_time: string;
  subject: string;
}

export interface AttendanceRecord {
  date: string;
  fn_status: 'Present' | 'Absent' | null;
  an_status: 'Present' | 'Absent' | null;
  total: number;
}

export interface DashboardStats {
  totalDepartments: number;
  totalStudents: number;
  totalFaculty: number;
  deptStats: { name: string; student_count: number }[];
  yearStats: { year: number; count: number }[];
  defaultFacultyStats?: { department_id: number; department_name: string; faculty_name: string }[];
}

export interface Evaluation {
  id: number;
  faculty_id: number;
  faculty_name?: string;
  department_id: number;
  department_name?: string;
  year: number;
  title: string;
  max_marks: number;
  type: 'Assignment' | 'Test' | 'Exam';
  date: string;
  marks_obtained?: number; // For student view
}

export interface StudentMark {
  student_id: number;
  student_name: string;
  roll_number: string;
  marks_obtained: number | null;
}

export interface Assignment {
  id: number;
  title: string;
  subject: string;
  department_id: number;
  department_name?: string;
  year: number;
  description: string;
  due_date: string;
  max_marks?: number;
  faculty_id: number;
  faculty_name?: string;
  file_path?: string;
  session?: string;
  created_at?: string;
  submission_status?: string;
  submission_id?: number;
  marks?: string;
  feedback?: string;
  submission_file_path?: string;
  submission_date?: string;
  review_date?: string;
}

export interface Submission {
  id: number;
  assignment_id: number;
  assignment_title?: string;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  file_path: string;
  submission_date: string;
  review_date?: string;
  status: string;
  marks?: string;
  feedback?: string;
  comments?: string;
}
