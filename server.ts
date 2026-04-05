import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("edutrack.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'faculty', 'student'
    ref_id INTEGER -- ID in students or faculty table
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    faculty_id INTEGER, -- Advisor
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id)
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    class_id INTEGER, -- Linked to classes table
    attendance INTEGER DEFAULT 0,
    present_sessions INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    marks INTEGER DEFAULT 0,
    faculty_id INTEGER,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    assigned_year INTEGER, -- Primary assigned year
    attendance TEXT, -- Stores the current OTP
    otp_timestamp INTEGER, -- Stores when the OTP was generated
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS faculty_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    class_id INTEGER, -- Added class_id
    year INTEGER NOT NULL DEFAULT 1,
    session TEXT NOT NULL, -- 'FN', 'AN'
    session_time TEXT NOT NULL,
    subject TEXT NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    session TEXT NOT NULL, -- 'FN', 'AN'
    status TEXT NOT NULL, -- 'Present', 'Absent'
    assignment_id INTEGER,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (assignment_id) REFERENCES faculty_assignments(id),
    UNIQUE(student_id, date, session)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    progress INTEGER DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    title TEXT NOT NULL,
    max_marks INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'Assignment', 'Test', 'Exam'
    date TEXT NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS student_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluation_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    marks_obtained INTEGER NOT NULL,
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(evaluation_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    class_id INTEGER, -- Linked to classes table
    description TEXT,
    due_date TEXT NOT NULL,
    max_marks INTEGER DEFAULT 100,
    faculty_id INTEGER NOT NULL,
    file_path TEXT,
    session TEXT, -- 'FN', 'AN'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    submission_date TEXT DEFAULT CURRENT_TIMESTAMP,
    review_date TEXT,
    status TEXT DEFAULT 'Submitted', -- 'Submitted', 'Reviewed', 'Graded'
    marks TEXT,
    feedback TEXT,
    comments TEXT,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(assignment_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'assignment_new', 'assignment_due', 'assignment_reviewed'
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS department_default_faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER UNIQUE NOT NULL,
    faculty_name TEXT NOT NULL DEFAULT '',
    faculty_id_str TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS student_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    session TEXT NOT NULL, -- 'FN', 'AN'
    booking_date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT DEFAULT 'Confirmed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    UNIQUE(student_id, session, booking_date)
  );
`);

// Seed default users if not exists
const seedUsers = () => {
  const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  if (!adminExists) {
    db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run('admin@gmail.com', 'admin123', 'admin');
    
    // Create a default department
    const dept = db.prepare("INSERT INTO departments (code, name) VALUES (?, ?)").run('CSE', 'Computer Science');
    const deptId = dept.lastInsertRowid;

    // Create a default class
    const classInfo = db.prepare("INSERT INTO classes (class_name, department_id, year) VALUES (?, ?, ?)").run('CSE Year 1', deptId, 1);
    const classId = classInfo.lastInsertRowid;

    // Create a default faculty
    const faculty = db.prepare("INSERT INTO faculty (faculty_id, name, email, department_id) VALUES (?, ?, ?, ?)").run('F001', 'Dr. Smith', 'faculty@gmail.com', deptId);
    db.prepare("INSERT INTO users (email, password, role, ref_id) VALUES (?, ?, ?, ?)").run('faculty@gmail.com', 'faculty123', 'faculty', faculty.lastInsertRowid);

    // Create a default student
    const student = db.prepare("INSERT INTO students (student_id, name, email, department_id, year, class_id) VALUES (?, ?, ?, ?, ?, ?)").run('S001', 'John Doe', 'student@gmail.com', deptId, 1, classId);
    db.prepare("INSERT INTO users (email, password, role, ref_id) VALUES (?, ?, ?, ?)").run('student@gmail.com', 'student123', 'student', student.lastInsertRowid);
  }
};
seedUsers();

// Update existing demo users to new gmail.com emails if they still have the old ones
try {
  db.prepare("UPDATE users SET email = 'admin@gmail.com' WHERE email = 'admin@edutrack.edu'").run();
  db.prepare("UPDATE users SET email = 'faculty@gmail.com' WHERE email = 'faculty@edutrack.edu'").run();
  db.prepare("UPDATE users SET email = 'student@gmail.com' WHERE email = 'student@edutrack.edu'").run();
  db.prepare("UPDATE faculty SET email = 'faculty@gmail.com' WHERE email = 'faculty@edutrack.edu'").run();
  db.prepare("UPDATE students SET email = 'student@gmail.com' WHERE email = 'student@edutrack.edu'").run();
} catch (e) {}

// Migration: Ensure class_id columns exist
try {
  db.prepare("ALTER TABLE students ADD COLUMN class_id INTEGER").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE assignments ADD COLUMN class_id INTEGER").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE assignments ADD COLUMN max_marks INTEGER DEFAULT 100").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE assignments ADD COLUMN session TEXT").run();
} catch (e: any) {}

// Create classes table if not exists (migration)
db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    class_number TEXT UNIQUE NOT NULL,
    block TEXT NOT NULL,
    capacity INTEGER,
    department_id INTEGER,
    year INTEGER,
    faculty_id INTEGER, -- Advisor
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id)
  );
`);

try {
  db.prepare("ALTER TABLE classes ADD COLUMN class_number TEXT").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE classes ADD COLUMN block TEXT").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE classes ADD COLUMN capacity INTEGER").run();
} catch (e: any) {}

// Migration: Create a default class if none exist and link students
try {
  const classCount = db.prepare("SELECT COUNT(*) as count FROM classes").get().count;
  if (classCount === 0) {
    const dept = db.prepare("SELECT id FROM departments LIMIT 1").get();
    if (dept) {
      const classInfo = db.prepare("INSERT INTO classes (class_name, department_id, year) VALUES (?, ?, ?)").run('Default Class', dept.id, 1);
      const classId = classInfo.lastInsertRowid;
      db.prepare("UPDATE students SET class_id = ? WHERE class_id IS NULL").run(classId);
    }
  }
  
  // Ensure classes exist for all faculty assignments
  db.exec(`
    INSERT INTO classes (class_name, department_id, year)
    SELECT d.name || ' - Year ' || fa.year, d.id, fa.year
    FROM departments d
    JOIN faculty_assignments fa ON d.id = fa.department_id
    WHERE NOT EXISTS (
      SELECT 1 FROM classes c 
      WHERE c.department_id = d.id AND c.year = fa.year
    )
    GROUP BY d.id, fa.year;
  `);
} catch (e) {}

// Migration: Ensure assigned_year column exists in faculty table
try {
  db.prepare("ALTER TABLE faculty ADD COLUMN assigned_year INTEGER").run();
} catch (e: any) {}

// Migration: Ensure session columns exist in faculty_assignments table
try {
  db.prepare("ALTER TABLE faculty_assignments ADD COLUMN session TEXT").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE faculty_assignments ADD COLUMN session_time TEXT").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE faculty_assignments ADD COLUMN subject TEXT").run();
} catch (e: any) {}

// Create attendance table if not exists (migration)
db.exec(`
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    session TEXT NOT NULL, -- 'FN', 'AN'
    status TEXT NOT NULL, -- 'Present', 'Absent'
    assignment_id INTEGER,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (assignment_id) REFERENCES faculty_assignments(id),
    UNIQUE(student_id, date, session)
  );
`);

// Migration: Ensure attendance column exists in faculty table
try {
  db.prepare("ALTER TABLE faculty ADD COLUMN attendance TEXT").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE faculty ADD COLUMN otp_timestamp INTEGER").run();
} catch (e: any) {}

// Migration: Ensure sessions columns exist in students table
try {
  db.prepare("ALTER TABLE students ADD COLUMN attendance INTEGER DEFAULT 0").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE students ADD COLUMN present_sessions INTEGER DEFAULT 0").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE students ADD COLUMN total_sessions INTEGER DEFAULT 0").run();
} catch (e: any) {}
// Migration: Ensure last_assignment_id exists in faculty table
try {
  db.prepare("ALTER TABLE faculty ADD COLUMN last_assignment_id INTEGER").run();
} catch (e: any) {}

// Migration: Ensure all columns exist in submissions table
try {
  db.prepare("ALTER TABLE submissions ADD COLUMN review_date TEXT").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE submissions ADD COLUMN feedback TEXT").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE submissions ADD COLUMN marks TEXT").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE submissions ADD COLUMN status TEXT DEFAULT 'Submitted'").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE submissions ADD COLUMN submission_date TEXT DEFAULT CURRENT_TIMESTAMP").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE department_default_faculty ADD COLUMN faculty_name TEXT NOT NULL DEFAULT ''").run();
} catch (e: any) {}
try {
  db.prepare("ALTER TABLE department_default_faculty ADD COLUMN faculty_id_str TEXT NOT NULL DEFAULT ''").run();
} catch (e: any) {}

// Migration: Create new tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS department_default_faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER UNIQUE NOT NULL,
    faculty_name TEXT NOT NULL DEFAULT '',
    faculty_id_str TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS student_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    session TEXT NOT NULL, -- 'FN', 'AN'
    booking_date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT DEFAULT 'Confirmed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    UNIQUE(student_id, session, booking_date)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth API
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
  
  // Departments
  app.get("/api/departments", (req, res) => {
    const depts = db.prepare(`
      SELECT d.*, (SELECT COUNT(*) FROM students WHERE department_id = d.id) as student_count 
      FROM departments d
    `).all();
    res.json(depts);
  });

  app.post("/api/departments", (req, res) => {
    const { code, name } = req.body;
    try {
      const info = db.prepare("INSERT INTO departments (code, name) VALUES (?, ?)").run(code, name);
      res.json({ id: info.lastInsertRowid });
    } catch (err) {
      res.status(400).json({ error: "Department code already exists" });
    }
  });

  app.put("/api/departments/:id", (req, res) => {
    const { name } = req.body;
    db.prepare("UPDATE departments SET name = ? WHERE id = ?").run(name, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/departments/:id", (req, res) => {
    const studentCount = db.prepare("SELECT COUNT(*) as count FROM students WHERE department_id = ?").get(req.params.id).count;
    if (studentCount > 0) {
      return res.status(400).json({ error: "Cannot delete department with students" });
    }
    db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Students
  app.get("/api/students", (req, res) => {
    const { department_id, year } = req.query;
    let query = `
      SELECT s.*, d.name as department_name, f.name as faculty_name
      FROM students s 
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN faculty f ON s.faculty_id = f.id
    `;
    const conditions = [];
    const params = [];
    
    if (department_id) {
      conditions.push("s.department_id = ?");
      params.push(department_id);
    }
    if (year) {
      conditions.push("s.year = ?");
      params.push(year);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const students = db.prepare(query).all(...params);
    res.json(students);
  });

  app.post("/api/students", (req, res) => {
    const { student_id, name, email, department_id, year, password, faculty_id } = req.body;
    try {
      const info = db.prepare("INSERT INTO students (student_id, name, email, department_id, year, faculty_id) VALUES (?, ?, ?, ?, ?, ?)").run(student_id, name, email, department_id, year, faculty_id || null);
      const studentId = info.lastInsertRowid;

      // Create user account for student
      db.prepare("INSERT INTO users (email, password, role, ref_id) VALUES (?, ?, ?, ?)").run(email, password || 'student123', 'student', studentId);

      res.json({ id: studentId });
    } catch (err) {
      res.status(400).json({ error: "Student ID or Email already exists" });
    }
  });

  app.put("/api/students/:id", (req, res) => {
    const { student_id, name, email, department_id, year, faculty_id, password } = req.body;
    const id = req.params.id;
    try {
      db.prepare("UPDATE students SET student_id = ?, name = ?, email = ?, department_id = ?, year = ?, faculty_id = ? WHERE id = ?")
        .run(student_id, name, email, department_id, year, faculty_id || null, id);
      
      // Update user account
      if (password) {
        db.prepare("UPDATE users SET email = ?, password = ? WHERE role = 'student' AND ref_id = ?").run(email, password, id);
      } else {
        db.prepare("UPDATE users SET email = ? WHERE role = 'student' AND ref_id = ?").run(email, id);
      }
      
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Update failed. Student ID or Email might already exist." });
    }
  });

  app.delete("/api/students/:id", (req, res) => {
    const id = req.params.id;
    db.prepare("DELETE FROM users WHERE role = 'student' AND ref_id = ?").run(id);
    db.prepare("DELETE FROM student_marks WHERE student_id = ?").run(id);
    db.prepare("DELETE FROM tasks WHERE student_id = ?").run(id);
    db.prepare("DELETE FROM students WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Faculty
  app.get("/api/faculty", (req, res) => {
    const faculty = db.prepare("SELECT f.*, d.name as department_name FROM faculty f JOIN departments d ON f.department_id = d.id").all();
    res.json(faculty);
  });

  app.get("/api/faculty/me/:id", (req, res) => {
    const faculty = db.prepare(`
      SELECT f.*, d.name as department_name 
      FROM faculty f 
      JOIN departments d ON f.department_id = d.id
      WHERE f.id = ?
    `).get(req.params.id);
    
    if (faculty) {
      res.json(faculty);
    } else {
      res.status(404).json({ error: "Faculty not found" });
    }
  });

  app.get("/api/students/me/:id", (req, res) => {
    const student = db.prepare(`
      SELECT s.*, d.name as department_name, f.name as faculty_name 
      FROM students s 
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN faculty f ON s.faculty_id = f.id
      WHERE s.id = ?
    `).get(req.params.id);
    
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  });

  app.post("/api/faculty", (req, res) => {
    const { faculty_id, name, email, department_id, password, assigned_year } = req.body;
    try {
      const info = db.prepare("INSERT INTO faculty (faculty_id, name, email, department_id, assigned_year) VALUES (?, ?, ?, ?, ?)").run(faculty_id, name, email, department_id, assigned_year || null);
      const facultyId = info.lastInsertRowid;
      
      // Also create a user account for the faculty with the provided password
      db.prepare("INSERT INTO users (email, password, role, ref_id) VALUES (?, ?, ?, ?)").run(email, password || 'faculty123', 'faculty', facultyId);
      
      res.json({ id: facultyId });
    } catch (err) {
      res.status(400).json({ error: "Faculty ID or Email already exists" });
    }
  });

  app.put("/api/faculty/:id", (req, res) => {
    const { faculty_id, name, email, department_id, password, assigned_year } = req.body;
    const id = req.params.id;
    try {
      db.prepare("UPDATE faculty SET faculty_id = ?, name = ?, email = ?, department_id = ?, assigned_year = ? WHERE id = ?")
        .run(faculty_id, name, email, department_id, assigned_year || null, id);
      
      // Update user account
      if (password) {
        db.prepare("UPDATE users SET email = ?, password = ? WHERE role = 'faculty' AND ref_id = ?").run(email, password, id);
      } else {
        db.prepare("UPDATE users SET email = ? WHERE role = 'faculty' AND ref_id = ?").run(email, id);
      }
      
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Update failed. Faculty ID or Email might already exist." });
    }
  });

  app.delete("/api/faculty/:id", (req, res) => {
    const id = req.params.id;
    // Check if assigned to any students or evaluations
    const studentCount = db.prepare("SELECT COUNT(*) as count FROM students WHERE faculty_id = ?").get(id).count;
    if (studentCount > 0) {
      return res.status(400).json({ error: "Cannot delete faculty assigned to students" });
    }
    db.prepare("DELETE FROM users WHERE role = 'faculty' AND ref_id = ?").run(id);
    db.prepare("DELETE FROM faculty_assignments WHERE faculty_id = ?").run(id);
    db.prepare("DELETE FROM evaluations WHERE faculty_id = ?").run(id);
    db.prepare("DELETE FROM department_default_faculty WHERE faculty_id_str = (SELECT faculty_id FROM faculty WHERE id = ?)").run(id);
    db.prepare("DELETE FROM student_bookings WHERE faculty_id = ?").run(id);
    db.prepare("DELETE FROM faculty WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Default Faculty per Department
  app.get("/api/admin/default-faculty", (req, res) => {
    const data = db.prepare(`
      SELECT ddf.*, d.name as department_name
      FROM department_default_faculty ddf
      JOIN departments d ON ddf.department_id = d.id
    `).all();
    res.json(data);
  });

  app.post("/api/admin/default-faculty", (req, res) => {
    const { department_id, faculty_name, faculty_id } = req.body;
    try {
      db.prepare(`
        INSERT INTO department_default_faculty (department_id, faculty_name, faculty_id_str)
        VALUES (?, ?, ?)
        ON CONFLICT(department_id) DO UPDATE SET 
          faculty_name = excluded.faculty_name,
          faculty_id_str = excluded.faculty_id_str
      `).run(department_id, faculty_name, faculty_id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Failed to set default faculty" });
    }
  });

  app.delete("/api/admin/default-faculty/:deptId", (req, res) => {
    try {
      db.prepare("DELETE FROM department_default_faculty WHERE department_id = ?").run(req.params.deptId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Failed to remove default faculty" });
    }
  });

  app.get("/api/departments/:id/default-faculty", (req, res) => {
    const data = db.prepare(`
      SELECT ddf.faculty_name as name, ddf.faculty_id_str as faculty_id, d.name as department_name
      FROM department_default_faculty ddf
      JOIN departments d ON ddf.department_id = d.id
      WHERE ddf.department_id = ?
    `).get(req.params.id);
    res.json(data || null);
  });

  app.delete("/api/departments/:id/default-faculty", (req, res) => {
    db.prepare("DELETE FROM department_default_faculty WHERE department_id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Student Bookings
  app.get("/api/student-bookings", (req, res) => {
    const { student_id, faculty_id, date } = req.query;
    let query = `
      SELECT sb.*, f.name as faculty_name, s.name as student_name, s.student_id as roll_number, d.name as department_name
      FROM student_bookings sb
      JOIN faculty f ON sb.faculty_id = f.id
      JOIN students s ON sb.student_id = s.id
      JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (student_id) {
      query += " AND sb.student_id = ?";
      params.push(student_id);
    }
    if (faculty_id) {
      query += " AND sb.faculty_id = ?";
      params.push(faculty_id);
    }
    if (date) {
      query += " AND sb.booking_date = ?";
      params.push(date);
    }
    const bookings = db.prepare(query).all(...params);
    res.json(bookings);
  });

  app.post("/api/student-bookings", (req, res) => {
    const { student_id, faculty_id, subject, session, booking_date } = req.body;
    try {
      db.prepare(`
        INSERT INTO student_bookings (student_id, faculty_id, subject, session, booking_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(student_id, faculty_id, subject, session, booking_date);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "You already have a booking for this session" });
    }
  });

  app.delete("/api/student-bookings/:id", (req, res) => {
    db.prepare("DELETE FROM student_bookings WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Faculty Specific: Get assigned students
  app.get("/api/faculty/:id/assigned-students", (req, res) => {
    const facultyId = req.params.id;
    const students = db.prepare(`
      SELECT s.*, d.name as department_name
      FROM students s 
      JOIN departments d ON s.department_id = d.id
      JOIN faculty_assignments fa ON s.department_id = fa.department_id AND s.year = fa.year
      WHERE fa.faculty_id = ?
      GROUP BY s.id
    `).all(facultyId);
    res.json(students);
  });

  // Faculty Specific: Get assignments
  app.get("/api/faculty/:id/assignments", (req, res) => {
    const facultyId = req.params.id;
    const assignments = db.prepare(`
      SELECT fa.*, d.name as department_name
      FROM faculty_assignments fa
      JOIN departments d ON fa.department_id = d.id
      WHERE fa.faculty_id = ?
    `).all(facultyId);
    res.json(assignments);
  });

  // Attendance History
  app.get("/api/students/:id/attendance-history", (req, res) => {
    const studentId = req.params.id;
    const history = db.prepare(`
      SELECT 
        date,
        MAX(CASE WHEN session = 'FN' THEN status END) as fn_status,
        MAX(CASE WHEN session = 'AN' THEN status END) as an_status,
        (
          (CASE WHEN MAX(CASE WHEN session = 'FN' THEN status END) = 'Present' THEN 1 ELSE 0 END) +
          (CASE WHEN MAX(CASE WHEN session = 'AN' THEN status END) = 'Present' THEN 1 ELSE 0 END)
        ) as total
      FROM attendance
      WHERE student_id = ?
      GROUP BY date
      ORDER BY date DESC
    `).all(studentId);
    res.json(history);
  });

  // Faculty Specific: Update student record
  app.post("/api/students/:id/update-record", (req, res) => {
    const { attendance, marks, present_sessions, total_sessions } = req.body;
    db.prepare("UPDATE students SET attendance = ?, marks = ?, present_sessions = ?, total_sessions = ? WHERE id = ?").run(attendance, marks, present_sessions || 0, total_sessions || 0, req.params.id);
    res.json({ success: true });
  });

  // Attendance OTP Logic
  app.post("/api/faculty/:id/generate-otp", (req, res) => {
    const facultyId = req.params.id;
    const { assignment_id } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const timestamp = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    const faculty = db.prepare("SELECT attendance, otp_timestamp, last_assignment_id FROM faculty WHERE id = ?").get(facultyId);
    const now = Date.now();
    const isRegenerating = faculty && faculty.attendance && (now - faculty.otp_timestamp < 60000) && faculty.last_assignment_id === parseInt(assignment_id);

    // Update faculty OTP and timestamp
    db.prepare("UPDATE faculty SET attendance = ?, otp_timestamp = ?, last_assignment_id = ? WHERE id = ?")
      .run(otp, timestamp, assignment_id, facultyId);

    if (isRegenerating) {
      return res.json({ otp });
    }

    // Get assignment details
    const assignment = db.prepare("SELECT * FROM faculty_assignments WHERE id = ?").get(assignment_id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    // Identify students who should be in this session
    // 1. Students who booked this faculty for this session/date
    const bookedStudents = db.prepare(`
      SELECT student_id FROM student_bookings 
      WHERE faculty_id = ? AND session = ? AND booking_date = ?
    `).all(facultyId, assignment.session, today);

    // 2. If this faculty is the default for a department, all students in that dept/year who DON'T have a booking
    const isDefault = db.prepare(`
      SELECT 1 FROM department_default_faculty ddf
      JOIN faculty f ON f.faculty_id = ddf.faculty_id_str
      WHERE ddf.department_id = ? AND f.id = ?
    `).get(assignment.department_id, facultyId);

    let defaultStudents: any[] = [];
    if (isDefault) {
      defaultStudents = db.prepare(`
        SELECT id as student_id FROM students 
        WHERE department_id = ? AND year = ?
        AND id NOT IN (
          SELECT student_id FROM student_bookings 
          WHERE session = ? AND booking_date = ?
        )
      `).all(assignment.department_id, assignment.year, assignment.session, today);
    }

    const allTargetStudents = [...new Set([...bookedStudents.map(s => s.student_id), ...defaultStudents.map(s => s.student_id)])];

    // For each student, increment total_sessions and mark as 'Absent' initially if not already present
    const checkAttendance = db.prepare("SELECT id FROM attendance WHERE student_id = ? AND date = ? AND session = ?");
    const insertAttendance = db.prepare("INSERT INTO attendance (student_id, date, session, status, assignment_id) VALUES (?, ?, ?, 'Absent', ?)");
    const updateStudent = db.prepare(`
      UPDATE students 
      SET total_sessions = total_sessions + 1,
          attendance = CASE 
            WHEN (total_sessions + 1) = 0 THEN 0 
            ELSE ROUND((CAST(present_sessions AS FLOAT) / (total_sessions + 1)) * 100) 
          END
      WHERE id = ?
    `);

    for (const studentId of allTargetStudents) {
      const existing = checkAttendance.get(studentId, today, assignment.session);
      if (!existing) {
        try {
          insertAttendance.run(studentId, today, assignment.session, assignment_id);
          updateStudent.run(studentId);
        } catch (e) {
          // Handle race conditions or unique constraint
        }
      }
    }

    res.json({ otp });
  });

  app.post("/api/students/:id/submit-otp", (req, res) => {
    const { otp, assignment_id } = req.body;
    const studentId = req.params.id;
    const today = new Date().toISOString().split('T')[0];

    // Get student and assignment details
    const assignment = db.prepare(`
      SELECT fa.*, f.attendance as faculty_otp, f.otp_timestamp, f.id as faculty_id
      FROM faculty_assignments fa
      JOIN faculty f ON f.id = fa.faculty_id
      WHERE fa.id = ?
    `).get(assignment_id);

    if (!assignment || assignment.faculty_otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP or session not active" });
    }

    // Check if OTP is expired (60 seconds)
    const now = Date.now();
    if (now - assignment.otp_timestamp > 60000) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Check if student is allowed to use this OTP
    // Case 1: Student has a booking with this faculty
    const booking = db.prepare(`
      SELECT id FROM student_bookings 
      WHERE student_id = ? AND faculty_id = ? AND session = ? AND booking_date = ?
    `).get(studentId, assignment.faculty_id, assignment.session, today);

    // Case 2: Faculty is default for student's department AND student has NO booking
    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
    const isDefault = db.prepare(`
      SELECT 1 FROM department_default_faculty ddf
      JOIN faculty f ON f.faculty_id = ddf.faculty_id_str
      WHERE ddf.department_id = ? AND f.id = ?
    `).get(student.department_id, assignment.faculty_id);

    const hasAnyBooking = db.prepare(`
      SELECT id FROM student_bookings 
      WHERE student_id = ? AND session = ? AND booking_date = ?
    `).get(studentId, assignment.session, today);

    const isAllowed = !!booking || (!!isDefault && !hasAnyBooking);

    if (!isAllowed) {
      return res.status(403).json({ error: "You are not eligible for this session" });
    }

    // Record in attendance table (Update existing 'Absent' record to 'Present')
    const result = db.prepare(`
      UPDATE attendance 
      SET status = 'Present', assignment_id = ?
      WHERE student_id = ? AND date = ? AND session = ? AND status = 'Absent'
    `).run(assignment_id, studentId, today, assignment.session);

    if (result.changes === 0) {
      // Check if already present
      const alreadyPresent = db.prepare("SELECT id FROM attendance WHERE student_id = ? AND date = ? AND session = ? AND status = 'Present'").get(studentId, today, assignment.session);
      if (alreadyPresent) {
        return res.status(400).json({ error: "Attendance already marked for this session" });
      }
      return res.status(400).json({ error: "Session not initialized for you" });
    }

    // Success: Increment present_sessions and update percentage
    const updatedStudent = db.prepare("SELECT present_sessions, total_sessions FROM students WHERE id = ?").get(studentId);
    const present_sessions = updatedStudent.present_sessions + 1;
    const total_sessions = updatedStudent.total_sessions;
    const newPercentage = Math.round((present_sessions / total_sessions) * 100);

    db.prepare(`
      UPDATE students 
      SET present_sessions = ?, attendance = ? 
      WHERE id = ?
    `).run(present_sessions, newPercentage, studentId);

    res.json({ 
      success: true, 
      attendance: newPercentage,
      present_sessions,
      total_sessions
    });
  });

  app.get("/api/students/:id/active-sessions", (req, res) => {
    const studentId = req.params.id;
    const today = new Date().toISOString().split('T')[0];
    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    
    // Check if student has a booking for today
    const booking = db.prepare(`
      SELECT faculty_id, session FROM student_bookings 
      WHERE student_id = ? AND booking_date = ?
    `).all(studentId, today);

    const bookedFacultyIds = booking.map((b: any) => b.faculty_id);
    const bookedSessions = booking.map((b: any) => b.session);

    // Get default faculty for student's department
    const defaultFaculty = db.prepare(`
      SELECT faculty_id_str as faculty_id FROM department_default_faculty WHERE department_id = ?
    `).get(student.department_id);

    const sessions = db.prepare(`
      SELECT f.name as faculty_name, fa.subject, fa.session, fa.session_time, fa.id as assignment_id, f.otp_timestamp, f.id as faculty_id, f.faculty_id as faculty_id_str
      FROM faculty f
      JOIN faculty_assignments fa ON f.id = fa.faculty_id
      WHERE f.attendance IS NOT NULL
    `).all();
    
    const now = Date.now();
    const activeSessions = sessions.filter((s: any) => {
      const isExpired = now - s.otp_timestamp > 60000;
      if (isExpired) return false;

      // Is this a booked session for the student?
      const isBooked = bookedFacultyIds.includes(s.faculty_id) && bookedSessions.includes(s.session);
      if (isBooked) return true;

      // Is this a default session for the student?
      const isDefault = defaultFaculty && defaultFaculty.faculty_id === s.faculty_id_str;
      const hasBookingForThisSession = bookedSessions.includes(s.session);
      if (isDefault && !hasBookingForThisSession) return true;

      return false;
    });

    res.json(activeSessions);
  });

  // Assignments & Submissions
  app.get("/api/assignments", (req, res) => {
    const { faculty_id, department_id, year, student_id } = req.query;
    let query = `
      SELECT a.*, f.name as faculty_name, d.name as department_name 
      FROM assignments a
      JOIN faculty f ON a.faculty_id = f.id
      JOIN departments d ON a.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (faculty_id) {
      query += " AND a.faculty_id = ?";
      params.push(faculty_id);
    }
    if (department_id) {
      query += " AND a.department_id = ?";
      params.push(department_id);
    }
    if (year) {
      query += " AND a.year = ?";
      params.push(year);
    }

    if (student_id) {
      // For students, show assignments for their department and year, including submission status
      const studentParams = [student_id];
      const studentQuery = `
        SELECT a.*, f.name as faculty_name, d.name as department_name,
               s.status as submission_status, s.id as submission_id, s.marks, s.feedback, 
               s.file_path as submission_file_path, s.submission_date, s.review_date
        FROM assignments a
        JOIN faculty f ON a.faculty_id = f.id
        JOIN departments d ON a.department_id = d.id
        JOIN students st ON st.id = ?
        LEFT JOIN submissions s ON (s.assignment_id = a.id AND s.student_id = st.id)
        WHERE a.department_id = st.department_id AND a.year = st.year
      `;
      const assignments = db.prepare(studentQuery).all(...studentParams);
      return res.json(assignments);
    }
    const assignments = db.prepare(query).all(...params);
    res.json(assignments);
  });

  app.post("/api/assignments", (req, res) => {
    const { title, subject, year, department_id, description, due_date, faculty_id, file_path, session, max_marks } = req.body;
    try {
      let finalDeptId = department_id;
      if (!finalDeptId) {
        // Fallback to faculty's primary department if not provided
        const faculty = db.prepare("SELECT department_id FROM faculty WHERE id = ?").get(faculty_id);
        if (!faculty) return res.status(404).json({ error: "Faculty not found" });
        finalDeptId = faculty.department_id;
      }

      const result = db.prepare(`
        INSERT INTO assignments (title, subject, department_id, year, description, due_date, faculty_id, file_path, session, max_marks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(title, subject, finalDeptId, year, description, due_date, faculty_id, file_path || null, session || null, max_marks || 100);
      
      const assignmentId = result.lastInsertRowid;

      // Notify students of that department and year
      const students = db.prepare("SELECT id FROM students WHERE department_id = ? AND year = ?").all(finalDeptId, year);
      const notifyStmt = db.prepare("INSERT INTO notifications (student_id, title, message, type) VALUES (?, ?, ?, ?)");
      for (const student of students) {
        notifyStmt.run(student.id, "New Assignment", `New assignment published: ${title} for ${subject}`, "assignment_new");
      }

      res.json({ id: assignmentId });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: "Failed to create assignment" });
    }
  });

  app.get("/api/submissions", (req, res) => {
    const { assignment_id, student_id, faculty_id } = req.query;
    let query = `
      SELECT sub.*, s.name as student_name, s.student_id as roll_number, a.title as assignment_title, a.max_marks
      FROM submissions sub
      JOIN students s ON sub.student_id = s.id
      JOIN assignments a ON sub.assignment_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (assignment_id) {
      query += " AND sub.assignment_id = ?";
      params.push(assignment_id);
    }
    if (student_id) {
      query += " AND sub.student_id = ?";
      params.push(student_id);
    }
    if (faculty_id) {
      query += " AND a.faculty_id = ?";
      params.push(faculty_id);
    }

    const submissions = db.prepare(query).all(...params);
    res.json(submissions);
  });

  app.post("/api/submissions", (req, res) => {
    const { assignment_id, student_id, file_path, comments } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO submissions (assignment_id, student_id, file_path, comments)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(assignment_id, student_id) DO UPDATE SET 
          file_path = excluded.file_path,
          comments = excluded.comments,
          submission_date = CURRENT_TIMESTAMP,
          status = 'Submitted'
      `).run(assignment_id, student_id, file_path, comments);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Failed to submit assignment" });
    }
  });

  app.put("/api/submissions/:id", (req, res) => {
    const { marks, feedback, status } = req.body;
    try {
      db.prepare("UPDATE submissions SET marks = ?, feedback = ?, status = ?, review_date = CURRENT_TIMESTAMP WHERE id = ?")
        .run(marks, feedback, status || 'Graded', req.params.id);
      
      // Notify student
      const submission = db.prepare(`
        SELECT s.student_id, a.title 
        FROM submissions s 
        JOIN assignments a ON s.assignment_id = a.id 
        WHERE s.id = ?
      `).get(req.params.id);
      
      if (submission) {
        db.prepare("INSERT INTO notifications (student_id, title, message, type) VALUES (?, ?, ?, ?)")
          .run(submission.student_id, "Assignment Graded", `Your submission for ${submission.title} has been graded.`, "assignment_reviewed");
      }

      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Failed to update submission" });
    }
  });

  app.get("/api/notifications", (req, res) => {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ error: "student_id is required" });
    const notifications = db.prepare("SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC LIMIT 20").all(student_id);
    res.json(notifications);
  });

  app.post("/api/notifications/:id/read", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });
  app.get("/api/evaluations", (req, res) => {
    const { faculty_id, department_id, year, student_id } = req.query;
    let query = `
      SELECT e.*, f.name as faculty_name, d.name as department_name 
      FROM evaluations e
      JOIN faculty f ON e.faculty_id = f.id
      JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (faculty_id) {
      query += " AND e.faculty_id = ?";
      params.push(faculty_id);
    }
    if (department_id) {
      query += " AND e.department_id = ?";
      params.push(department_id);
    }
    if (year) {
      query += " AND e.year = ?";
      params.push(year);
    }
    if (student_id) {
      // For students, show evaluations for their department and year
      const studentParams = [student_id];
      const studentQuery = `
        SELECT e.*, f.name as faculty_name, d.name as department_name, sm.marks_obtained
        FROM evaluations e
        JOIN faculty f ON e.faculty_id = f.id
        JOIN departments d ON e.department_id = d.id
        JOIN students s ON (e.department_id = s.department_id AND e.year = s.year)
        LEFT JOIN student_marks sm ON (sm.evaluation_id = e.id AND sm.student_id = s.id)
        WHERE s.id = ?
      `;
      const evaluations = db.prepare(studentQuery).all(...studentParams);
      return res.json(evaluations);
    }

    const evaluations = db.prepare(query).all(...params);
    res.json(evaluations);
  });

  app.post("/api/evaluations", (req, res) => {
    const { faculty_id, department_id, year, title, max_marks, type, date } = req.body;
    const result = db.prepare(`
      INSERT INTO evaluations (faculty_id, department_id, year, title, max_marks, type, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(faculty_id, department_id, year, title, max_marks, type, date);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/evaluations/:id/marks", (req, res) => {
    const evaluationId = req.params.id;
    const marks = db.prepare(`
      SELECT s.id as student_id, s.name as student_name, s.student_id as roll_number, sm.marks_obtained
      FROM students s
      JOIN evaluations e ON (s.department_id = e.department_id AND s.year = e.year)
      LEFT JOIN student_marks sm ON (sm.evaluation_id = e.id AND sm.student_id = s.id)
      WHERE e.id = ?
    `).all(evaluationId);
    res.json(marks);
  });

  app.post("/api/evaluations/:id/marks", (req, res) => {
    const evaluationId = req.params.id;
    const { marks } = req.body; // Array of { student_id, marks_obtained }

    const insert = db.prepare(`
      INSERT INTO student_marks (evaluation_id, student_id, marks_obtained)
      VALUES (?, ?, ?)
      ON CONFLICT(evaluation_id, student_id) DO UPDATE SET marks_obtained = excluded.marks_obtained
    `);

    const transaction = db.transaction((marksList) => {
      for (const m of marksList) {
        insert.run(evaluationId, m.student_id, m.marks_obtained);
      }
    });

    transaction(marks);
    res.json({ success: true });
  });

  // Faculty Assignments
  app.get("/api/faculty-assignments", (req, res) => {
    const assignments = db.prepare(`
      SELECT fa.*, f.name as faculty_name, f.faculty_id as faculty_code, f.email as faculty_email, d.name as department_name, c.class_name
      FROM faculty_assignments fa 
      JOIN faculty f ON fa.faculty_id = f.id 
      JOIN departments d ON fa.department_id = d.id
      LEFT JOIN classes c ON fa.class_id = c.id
    `).all();
    res.json(assignments);
  });

  app.post("/api/faculty-assignments", (req, res) => {
    const { faculty_id, department_id, class_id, year, session, session_time, subject } = req.body;
    db.prepare("INSERT INTO faculty_assignments (faculty_id, department_id, class_id, year, session, session_time, subject) VALUES (?, ?, ?, ?, ?, ?, ?)").run(faculty_id, department_id, class_id || null, year || 1, session, session_time, subject);
    res.json({ success: true });
  });

  app.put("/api/faculty-assignments/:id", (req, res) => {
    const { faculty_id, department_id, class_id, year, session, session_time, subject } = req.body;
    db.prepare("UPDATE faculty_assignments SET faculty_id = ?, department_id = ?, class_id = ?, year = ?, session = ?, session_time = ?, subject = ? WHERE id = ?")
      .run(faculty_id, department_id, class_id || null, year || 1, session, session_time, subject, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/faculty-assignments/:id", (req, res) => {
    db.prepare("DELETE FROM faculty_assignments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const stats = {
      totalDepartments: db.prepare("SELECT COUNT(*) as count FROM departments").get().count,
      totalStudents: db.prepare("SELECT COUNT(*) as count FROM students").get().count,
      totalFaculty: db.prepare("SELECT COUNT(*) as count FROM faculty").get().count,
      deptStats: db.prepare(`
        SELECT d.name, COUNT(s.id) as student_count 
        FROM departments d 
        LEFT JOIN students s ON d.id = s.department_id 
        GROUP BY d.id
      `).all(),
      yearStats: db.prepare(`
        SELECT year, COUNT(*) as count 
        FROM students 
        GROUP BY year
      `).all(),
      defaultFacultyStats: db.prepare(`
        SELECT df.department_id, d.name as department_name, df.faculty_name
        FROM department_default_faculty df
        JOIN departments d ON df.department_id = d.id
      `).all()
    };
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
