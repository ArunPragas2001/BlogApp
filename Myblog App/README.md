# 📝 BlogSphere — Modern Full-Stack Blogging Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/JWT-Auth-F7B731?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render"/>
  <img src="https://img.shields.io/badge/License-MIT-4F46E5?style=for-the-badge" alt="MIT License"/>
</p>

<p align="center">
  <strong>BlogSphere</strong> is a feature-rich, full-stack blogging platform where writers publish, admins moderate, and readers explore — all with a stunning modern UI, dark mode, role-based access, and real-time email notifications.
</p>

<p align="center">
  🌐 <strong>Live Backend:</strong> <a href="https://blogsphere-wtrv.onrender.com">https://blogsphere-wtrv.onrender.com</a>
</p>

---

## ✨ Features

| Feature | Description | Status |
|---|---|---|
| 🔐 JWT Authentication | Secure register, login, and protected routes | ✅ |
| 👥 Role-Based Access | Roles: `user` (blogger), `admin`, `owner` | ✅ |
| 📝 Blog Management | Create, Edit, Delete, Approve, and Preview blogs | ✅ |
| 🖼️ Image Uploads | Cover images for blogs, profile photo via camera picker | ✅ |
| 🌑 Dark Mode | System-wide dark/light toggle persisted per user | ✅ |
| 📊 Dashboard | Stats cards, blog list with filter tabs (All / Published / Pending) | ✅ |
| 👤 Profile Page | Avatar zoom lightbox, sample avatar picker, file upload | ✅ |
| 🛡️ Admin Panel | Approve blogs, manage users (block/role change), site settings | ✅ |
| 🔑 Forgot Password | 6-digit email verification code, 2-step password reset flow | ✅ |
| 💪 Password Strength | Real-time strength meter + "Suggest Strong Password" button | ✅ |
| 📧 Email Notifications | Subscriber welcome emails, password reset codes via Nodemailer | ✅ |
| 📱 Responsive Design | Fully optimized for mobile, tablet, and desktop | ✅ |
| ⬆️⬇️ Navigation Helpers | Floating scroll-to-top, scroll-to-bottom, previous page buttons | ✅ |

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** — Semantic, accessible markup
- **CSS3** — Vanilla CSS with custom design system (dark mode, glassmorphism, animations)
- **JavaScript (ES6+)** — Modular JS, async/await, Fetch API

### Backend
- **Node.js** + **Express.js** — RESTful API server
- **MongoDB Atlas** + **Mongoose** — Cloud NoSQL database
- **JWT** — Stateless authentication tokens
- **Multer** — File upload handling (profile images, blog covers)
- **Nodemailer** — SMTP email dispatch (Gmail App Password)
- **bcryptjs** — Password hashing
- **CORS** + **dotenv** — Security and configuration

---

## 📁 Project Structure

```
BlogSphere/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB Atlas connection
│   │   └── emailService.js        # Nodemailer & email templates
│   ├── controllers/
│   │   ├── authControl.js         # Register, login, profile, forgot/reset password
│   │   ├── blogControl.js         # Blog CRUD & approval
│   │   ├── settingsControl.js     # Site settings (owner only)
│   │   └── subscriberControl.js   # Newsletter subscription + welcome email
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification guard
│   │   └── roleMiddleware.js      # Role-based route guards
│   ├── models/
│   │   ├── user.js                # User schema (roles, password reset fields)
│   │   ├── blog.js                # Blog schema (status, image, approval)
│   │   ├── settings.js            # Site settings schema
│   │   └── subscriber.js          # Email subscriber schema
│   ├── routes/
│   │   ├── authRoute.js           # /api/auth/*
│   │   ├── blogRoute.js           # /api/blogs/*
│   │   ├── settingsRoute.js       # /api/settings
│   │   ├── uploadRoute.js         # /api/upload
│   │   └── subscriberRoute.js     # /api/subscribers
│   └── server.js                  # Entry point, middleware config
│
├── css/
│   ├── Home.css                   # Main landing page styles
│   ├── dashboard.css              # Dashboard styles
│   ├── profile.css                # Profile page + global header styles
│   ├── createBlog.css             # Blog editor styles
│   ├── login.css / register.css   # Auth page styles
│   ├── darkmode.css               # Global dark mode overrides
│   ├── navigationHelpers.css      # Floating buttons + password strength meter
│   └── toast.css                  # Toast notification styles
│
├── js/
│   ├── main.js                    # Home page (blog feed, search, article reader)
│   ├── dashboard.js               # Dashboard (stats, blog management)
│   ├── profile.js                 # Profile (avatar, password change, save)
│   ├── createBlog.js              # Blog editor (create + edit)
│   ├── login.js                   # Login + forgot/reset password flow
│   ├── register.js                # Registration + validation
│   ├── adminSettings.js           # Admin site config
│   ├── navigationHelpers.js       # Scroll helpers + password strength utilities
│   ├── theme.js                   # Dark mode toggle
│   └── toast.js                   # Toast notification system
│
├── index.html                     # 🏠 Home / Blog Feed
├── dashboard.html                 # 📊 User Dashboard
├── profile.html                   # 👤 User Profile
├── createBlog.html                # ✍️  Blog Editor
├── login.html                     # 🔐 Login + Password Recovery
├── register.html                  # 📝 Registration
├── adminSettings.html             # ⚙️  Admin Site Settings
└── README.md
```

---

## 🔌 API Endpoints

### 🔐 Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/register` | Create new account | ❌ |
| `POST` | `/login` | Login & receive JWT token | ❌ |
| `GET` | `/me` | Get current user profile | ✅ |
| `PUT` | `/profile` | Update name, email, bio, photo, password | ✅ |
| `POST` | `/forgot-password` | Send 6-digit reset code to email | ❌ |
| `POST` | `/reset-password` | Verify code & set new password | ❌ |

### 📝 Blogs — `/api/blogs`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Get all published blogs | ❌ |
| `GET` | `/:id` | Get single blog by ID | ❌ |
| `POST` | `/` | Create a new blog post | ✅ User+ |
| `PUT` | `/:id` | Edit own blog post | ✅ Author |
| `PUT` | `/:id/approve` | Approve a pending blog | ✅ Admin/Owner |
| `DELETE` | `/:id` | Delete blog | ✅ Author/Admin |

### ⚙️ Settings & Other

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/settings` | Get site-wide settings | ✅ |
| `PUT` | `/api/settings` | Update site settings | ✅ Owner |
| `POST` | `/api/upload` | Upload image file | ✅ |
| `POST` | `/api/subscribers` | Subscribe to newsletter | ❌ |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js `v18+` and npm `v9+`
- MongoDB Atlas account (free tier works)
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled

### 1. Clone the Repository
```bash
git clone https://github.com/ArunPragas2001/BlogApp.git
cd BlogApp
```

### 2. Install Backend Dependencies
```bash
cd "Myblog App/backend"
npm install
```

### 3. Configure Environment Variables
Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/blogsphere
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:5500
```

### 4. Start the Backend Server
```bash
node server.js
# ✅ Server running on http://localhost:5000
# ✅ MongoDB Atlas connected
```

### 5. Open the Frontend
Open `index.html` with the **Live Server** VS Code extension (port 5500).

---

## ☁️ Deployment

### Backend — Render.com
1. Push your project to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Root Directory**: `Myblog App/backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`
6. Add all `.env` variables under **Environment**
7. Deploy — Backend URL: `https://blogsphere-wtrv.onrender.com`

### Frontend
Upload the HTML/CSS/JS files to **GitHub Pages**, **Vercel**, or **Netlify**.  
All JS files already point to the Render backend via `API_BASE_URL`.

---

## 🔑 User Roles

| Role | Permissions |
|------|------------|
| `user` | Write, edit, delete own blogs; manage own profile |
| `admin` | All user permissions + approve/reject blogs, view all users |
| `owner` | All admin permissions + site settings, role management, block users |

> **Note:** Admin accounts require Owner approval after registration.

---

## 📸 Pages Overview

| Page | Description |
|------|-------------|
| 🏠 **Home** | Blog feed with search, filters, newsletter, article reader |
| 📊 **Dashboard** | Personal stats, blog list with status tabs, quick actions |
| ✍️ **Create Blog** | Rich blog editor with cover image upload, categories & tags |
| 👤 **Profile** | Avatar management, password change with strength meter |
| 🔐 **Login** | Login + 2-step forgot password with email verification code |
| 📝 **Register** | Registration with role selection and real-time password strength |
| ⚙️ **Admin Settings** | Site name, description, config (owner only) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Arun Pragas**  
Full-Stack Developer | BlogSphere Creator

[![GitHub](https://img.shields.io/badge/GitHub-ArunPragas2001-181717?style=flat-square&logo=github)](https://github.com/ArunPragas2001)

---

<p align="center">Made with ❤️ and ☕ — <strong>BlogSphere</strong> © 2026</p>
