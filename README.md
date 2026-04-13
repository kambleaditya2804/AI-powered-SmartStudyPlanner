# 📚 Smart Study Planner
An AI-powered full-stack study management platform that helps students prepare for competitive exams with personalized schedules, spaced repetition, and AI-generated content.

🌐 **Live Demo:** [ai-powered-smart-study-planner.vercel.app](https://ai-powered-smart-study-planner.vercel.app)

---

## ✨ Features

### 📅 Smart Scheduling
- AI-powered study schedule generation based on topic priority, difficulty, and confidence
- SM-2 spaced repetition algorithm for optimal revision timing
- Weekly calendar view with session management
- Pomodoro timer with focus/short/long break modes

### 🧠 AI-Powered Tools
- **Mock Test Generator** — AI generates MCQ questions from your topics using Groq AI
- **AI Flashcard Generator** — Paste your notes and AI instantly creates flashcards
- **YouTube Integration** — Curated video recommendations per topic

### 📊 Analytics & Progress
- Real-time exam readiness score (0-100%)
- Subject-wise progress breakdown
- Study streak tracking and XP gamification
- Session completion analytics

### 🃏 Flashcard System
- Flip cards with SM-2 spaced repetition review
- Bulk import via Q:/A: format
- AI auto-generation from notes
- Due cards dashboard

### 🔔 Smart Notifications
- Streak break warnings
- Topics not studied in 3+ days
- Daily session reminders
- Exam approaching alerts
- Flashcard review reminders

### 🎯 Additional Features
- JWT authentication with secure sessions
- Mobile responsive UI with hamburger menu
- Dark mode design
- Multi-topic management with confidence tracking
- Redux state management

---

## 🛠️ Tech Stack

**Frontend:**
- React.js + Vite
- Redux Toolkit
- TailwindCSS v3
- React Query (@tanstack/react-query)
- React Router DOM

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs

**AI & APIs:**
- Groq AI (LLaMA 3.1) — Quiz & flashcard generation
- YouTube Data API v3 — Resource recommendations

**Deployment:**
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Groq API key (free at console.groq.com)
- YouTube Data API key (Google Cloud Console)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/smart-study-planner.git
cd smart-study-planner
```

**2. Install all dependencies**
```bash
npm run install:all
```

**3. Set up environment variables**

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
YOUTUBE_API_KEY=your_youtube_api_key
GROQ_API_KEY=your_groq_api_key
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

**4. Run the app**
```bash
npm run dev
```

- Frontend → http://localhost:5173
- Backend → http://localhost:5000

---

## 📁 Project Structure

```
smart-study-planner/
├── client/                     # React frontend
│   └── src/
│       ├── api/                # Axios instance
│       ├── components/         # Reusable components
│       │   ├── Navbar.jsx
│       │   ├── TodaySchedule.jsx
│       │   ├── Flashcards.jsx
│       │   ├── NotificationBell.jsx
│       │   ├── YouTubeResources.jsx
│       │   └── Skeleton.jsx
│       ├── pages/              # Page components
│       │   ├── Dashboard.jsx
│       │   ├── Onboarding.jsx
│       │   ├── Topics.jsx
│       │   ├── Schedule.jsx
│       │   ├── Flashcards.jsx
│       │   ├── Progress.jsx
│       │   ├── Pomodoro.jsx
│       │   ├── Quiz.jsx
│       │   └── AIFlashcards.jsx
│       └── store/              # Redux store
│           ├── store.js
│           └── authSlice.js
│
└── server/                     # Node.js backend
    └── src/
        ├── config/             # Database config
        ├── controllers/        # Route controllers
        ├── middleware/         # Auth & error handling
        ├── models/             # Mongoose models
        ├── routes/             # Express routes
        └── services/           # Business logic
            ├── scheduleEngine.js
            ├── spacedRepetition.js
            ├── aiFlashcard.js
            ├── openai.js (Groq)
            ├── youtube.js
            └── notification.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/plans` | Get all study plans |
| POST | `/api/plans` | Create study plan |
| POST | `/api/plans/:id/topics/bulk` | Bulk add topics |
| POST | `/api/plans/:id/sessions/generate` | Generate schedule |
| GET | `/api/sessions/today` | Get today's sessions |
| GET | `/api/flashcards/due` | Get due flashcards |
| PATCH | `/api/flashcards/:id/review` | Review flashcard (SM-2) |
| POST | `/api/quiz/generate` | Generate AI quiz |
| POST | `/api/ai-flashcards/generate` | Generate flashcards from notes |
| GET | `/api/youtube/search` | Search YouTube videos |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/progress/:planId` | Get plan analytics |

---

## 📸 Screenshots

> Dashboard, Topics, Quiz, Flashcards, Schedule pages
<img width="1901" height="956" alt="image" src="https://github.com/user-attachments/assets/44678a48-c501-4777-bb7b-80e5996a2bd9" /># 📚 Smart Study Planner
<img width="1884" height="960" alt="image" src="https://github.com/user-attachments/assets/d4137fce-37d6-4dec-8a10-fdc00a4c1bd3" />
<img width="1900" height="952" alt="image" src="https://github.com/user-attachments/assets/f0e1cb75-8056-4b19-9041-71f2ee80165d" />
<img width="1893" height="959" alt="image" src="https://github.com/user-attachments/assets/0de3222f-4457-43ed-be68-31fb322715d5" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/463b9812-d9b8-4f4d-948e-e740cc757f25" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/0f7e0873-550d-4059-a0a0-f78e1464b0bc" />


---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT License — feel free to use this project for learning or portfolio purposes.

---

## 👨‍💻 Author

**Aditya Kamble**

- GitHub: (https://github.com/kambleaditya2804)
- LinkedIn: (https://www.linkedin.com/in/aditya-kamble-65281a385)

---

⭐ If you found this project helpful, please give it a star!
