# SutraAI - EdTech Platform

SutraAI is an interactive educational web platform built with a **Spring Boot** backend and a **React** frontend. It features student progress tracking, interactive quizzes, focus mode monitoring, and real-time analytics.

---

## 🛠️ Tech Stack

- **Backend:** Java, Spring Boot, Spring Data JPA, H2 Database (In-Memory)
- **Frontend:** React, Node.js (`npm`), Tailwind CSS / Vite
- **Database Console:** H2 Web Console (`http://localhost:8080/h2-console`)

---

## 🚀 Prerequisites

Before getting started, make sure you have the following installed on your system:

1. **Java JDK 17+** (Required for Spring Boot)
2. **Node.js (v20+ or LTS)** & **npm** (Required for React)

> **Windows PowerShell Execution Policy Note:**  
> If you encounter a script execution error when running `npm`, run PowerShell as Administrator and execute:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

## ⚡ Quick Start Guide

### 1. Start the Backend (Spring Boot)

Navigate to the backend project directory and start the application:

```bash
cd sutraai-backend
mvn spring-boot:run
```

- The API server will start at: `http://localhost:8080`
- The H2 Database Console will be accessible at: `http://localhost:8080/h2-console`
  - **JDBC URL:** `jdbc:h2:mem:sutraaidb`
  - **Username:** `sa`
  - **Password:** *(leave blank)*

---

### 2. Populate Sample Database Data

Once the backend is running, open the H2 Console in your browser:  
`http://localhost:8080/h2-console`

Execute the following SQL script to insert sample student profiles, attempt logs, and focus mode violations:

```sql
-- Insert Sample Student Profiles
INSERT INTO users (identifier, name, display_name, role, class_group, points, xp) VALUES
('STU001', 'Pohit Kumar', 'Pohit K.', 'student', 'Class 6', 150, 1250),
('STU002', 'Akella Kausthav', 'Akella K.', 'student', 'Class 8', 220, 2350),
('STU003', 'Dubala Sai Teja', 'Dubala S.', 'student', 'Class 10', 180, 1980),
('STU004', 'Ananya Rao', 'Ananya R.', 'student', 'Class 8', 190, 1920),
('STU005', 'Rohan Verma', 'Rohan V.', 'student', 'Class 8', 90, 730),
('STU006', 'Priya Patel', 'Priya P.', 'student', 'Class 6', 160, 1840),
('STU007', 'Kavya Sharma', 'Kavya S.', 'student', 'Class 7', 110, 980),
('STU008', 'Aditya Joshi', 'Aditya J.', 'student', 'Class 8', 210, 2100);

-- Insert Sample Attempt Logs
INSERT INTO attempts (user_id, question_id, subject, chapter, difficulty_level, is_correct, response_seconds, timed_out, created_at) VALUES
(1, 'c6_m_1_1', 'Mathematics', 'Knowing Our Numbers', 1, TRUE, 12, FALSE, CURRENT_TIMESTAMP()),
(2, 'c8_m_1_1', 'Mathematics', 'Linear Equations in 1 Var', 1, TRUE, 15, FALSE, CURRENT_TIMESTAMP()),
(2, 'c8_m_2_1', 'Mathematics', 'Linear Equations in 1 Var', 2, TRUE, 22, FALSE, CURRENT_TIMESTAMP()),
(3, 'c10_s_1_1', 'Science', 'Chemical Reactions and Equations', 1, TRUE, 10, FALSE, CURRENT_TIMESTAMP());

-- Insert Sample Focus Mode Violations
INSERT INTO violations (user_id, session_id, class_group, created_at) VALUES
(5, 'sess_101', 'Class 8', CURRENT_TIMESTAMP()),
(5, 'sess_101', 'Class 8', CURRENT_TIMESTAMP());
```

---

### 3. Start the Frontend (React)

Open a new terminal window, navigate to the frontend directory, install dependencies, and start the development server:

```bash
cd sutraai-frontend-project
npm install
npm run dev
```

- The React web application will start at: `http://localhost:5173`

---

## 📊 Database Schema Overview

| Table | Description |
|---|---|
| **users** | Holds student & teacher profiles, class groups, points, and XP. |
| **attempts** | Tracks student quiz submissions, timing, difficulty, and correctness. |
| **violations** | Logs focus-mode tab switches/interruptions during test sessions. |

---

## 🔍 Verification & Troubleshooting

- **Verify Database Contents:**
  ```sql
  SELECT * FROM users WHERE role = 'student';
  ```
- **Port Conflicts:** Ensure ports `8080` (Backend) and `5173` (Frontend) are free before launching.