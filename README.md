# 11+ Exam Preparation Platform

> AI-Powered Adaptive Learning & Examination System for UK 11+ Mathematics

---

## 📌 About The Project

The 11+ Exam Preparation Platform is a full-stack web application
designed to help students aged 10–13 prepare for the UK 11+ entrance
examinations through intelligent, gamified, and adaptive mathematics
practice.

The platform uses OpenAI GPT-4 Turbo to automatically generate 750
fresh MCQ questions every day across 5 mathematics topics and 15
difficulty sub-levels. The adaptive engine promotes students through
sub-levels in real-time based on their answer streak — from Beginner
Bronze all the way to Advanced Diamond.

---

## ✨ Features

- 🤖 AI generates 750 fresh questions daily using OpenAI GPT-4 Turbo
- 🎯 Adaptive difficulty engine with 15 sub-levels
- 📝 Three test modes — Practice, Timed Test, and Challenge
- 🎮 Gamification — XP points, coins, badges, and streaks
- 👨‍👩‍👧 Parent Dashboard to monitor child progress
- 🔐 Secure JWT authentication via Supabase Auth
- 📊 Real-time progress tracking and test history
- 🌙 Auto question refresh every midnight via cron job

---

## 🛠️ Built With

- **Frontend** — React 18, Vite 5, React Router DOM 6
- **Backend** — Node.js 18, Express 4.18
- **Database** — Supabase (PostgreSQL 15)
- **Authentication** — Supabase Auth (JWT)
- **AI** — OpenAI GPT-4 Turbo
- **Animations** — Framer Motion, Three.js
- **Scheduler** — node-cron

---

## 📁 Project Structure

```
11plus-exam/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RolePage.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── ParentDashboard.jsx
│   │   │   ├── TopicPage.jsx
│   │   │   ├── LevelPage.jsx
│   │   │   ├── TestPage.jsx
│   │   │   ├── PracticePage.jsx
│   │   │   ├── ChallengePage.jsx
│   │   │   ├── RewardsPage.jsx
│   │   │   └── ExamInstructionPage.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useQuestionSession.js
│   │   ├── utils/
│   │   │   ├── supabaseClient.js
│   │   │   └── startTestSession.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   ├── users.js
│   │   ├── questions.js
│   │   ├── results.js
│   │   └── ai.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
│
└── database/
    └── schema.sql
```

---

## ⚙️ Prerequisites

Before running this project make sure you have the following:

- Node.js 18 or above
- npm
- A Supabase account — https://supabase.com
- An OpenAI API key — https://platform.openai.com

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/11plus-exam.git
cd 11plus-exam
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
PORT=5000
```

Start the backend server:

```bash
node server.js
```

The backend will run on `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

---

### 4. Database Setup

- Open your Supabase project dashboard
- Go to the SQL Editor
- Copy and run the contents of `database/schema.sql`
- All 5 tables will be created automatically
- Start the backend — it will auto-generate 750 questions
  on first startup if the question pool is empty

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| profiles | Stores user account info for students and parents |
| student_progress | XP points, coins, level, streak, and badges |
| questions | AI-generated MCQ question pool (750 questions) |
| test_sessions | Records of every completed test session |
| test_answers | Individual answer for every question in every session |

---

## 📐 Question Pool Structure

```
3 Main Levels × 5 Sub-levels × 5 Topics × 10 Questions = 750 Total
```

| Main Level    | Sub-levels                                    |
|---------------|-----------------------------------------------|
| Beginner      | Bronze, Silver, Gold, Platinum, Diamond       |
| Intermediate  | Bronze, Silver, Gold, Platinum, Diamond       |
| Advanced      | Bronze, Silver, Gold, Platinum, Diamond       |

### Topics
1. Number & Arithmetic
2. Algebra & Logic
3. Geometry & Measure
4. Data & Probability
5. Pattern Recognition

---

## 🎯 How The Adaptive Engine Works

```
Start Test → Fetch Question → Student Answers
     ↓
Correct Answer → Streak + 1
Wrong Answer  → Streak = 0
     ↓
Streak = 5    → Advance to Next Sublevel ✅
Attempts = 15 → Auto Advance to Next Sublevel ✅
     ↓
LevelUp Animation → Continue to Next Sublevel
     ↓
All Sublevels Done → Session Complete → Save Results
```

---

## 👥 User Roles

### 🎓 Student
- Register and login securely
- Choose topic and difficulty level
- Take adaptive timed tests
- Practice with hints and explanations
- Participate in Challenge Mode
- Earn XP, coins, and badges
- View progress on Student Dashboard

### 👨‍👩‍👧 Parent
- Access child dashboard using child email
- View child level, accuracy, and coins
- Monitor topic-wise performance
- Track sublevel progression
- Browse complete test history

---

## 🤖 AI Question Generation

| Property | Details |
|---|---|
| Model | OpenAI GPT-4 Turbo |
| Total Questions | 750 per day |
| Refresh Schedule | Every day at midnight (node-cron) |
| Auto Seed | Triggers automatically if pool is empty on startup |
| Validation | Unique options, correct index range, non-empty explanation |

---

## 🔐 Security

- OpenAI API key stored only on the backend server
- Frontend never communicates with OpenAI directly
- Supabase Row Level Security (RLS) on all tables
- Students can only read their own data
- JWT tokens manage all user sessions
- All sensitive keys stored as environment variables

---

## ☁️ Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel or Netlify (static build) |
| Backend | Render or Railway (Node.js host) |
| Database | Supabase Cloud (fully managed) |

Set all environment variables in your hosting platform dashboard
before deploying.

---

## 📸 Screenshots

| Screen | Description |
|---|---|
| Home Screen | Landing page with animated background |
| Login Screen | Secure email and password login |
| Student Dashboard | XP, coins, accuracy, and topic stats |
| Active Test | Adaptive MCQ with timer and streak |
| Level Up | Animated sublevel promotion celebration |
| Parent Dashboard | Child progress monitoring |

---

## 🔮 Future Enhancements

- [ ] Add English, Verbal Reasoning, and Non-Verbal Reasoning subjects
- [ ] Build teacher portal for question review and approval
- [ ] Add live multiplayer challenge mode
- [ ] Create full mock exam papers
- [ ] Build iOS and Android mobile apps
- [ ] Add parent email and SMS notifications
- [ ] Introduce AI tutor chat for on-demand help
- [ ] Launch subscription plans with Stripe payments

---

## 📄 License

This project is developed for educational purposes as part of
an academic internship project.

---

## 👨‍💻 Author

**[Virendra Shende]**
Academic Year: 2025–2026

---

## 🙏 Acknowledgements

- [OpenAI](https://openai.com) — GPT-4 Turbo API
- [Supabase](https://supabase.com) — Database and Authentication
- [React](https://react.dev) — Frontend Framework
- [Three.js](https://threejs.org) — 3D Animations
- [Framer Motion](https://www.framer.com/motion) — UI Animations
