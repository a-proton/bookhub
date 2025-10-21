# 📚 BookHub - Book Rental Platform

**BookHub** is a modern and user-friendly **Book Rental Platform** built using the **MERN stack (MongoDB, Express, React, Node.js)** with **ShadCN/UI** for a clean, responsive interface.  
It allows users to browse, rent, and return books seamlessly — complete with an intelligent recommendation system that suggests books based on each user’s preferences.

🔗 **Live Demo:** [https://bookhubrentalplatform.vercel.app/](https://bookhubrentalplatform.vercel.app/)

---

## 🚀 Features

- 🔐 **Authentication & Authorization** — Secure user login/register using JWT
- 📚 **Browse, Search & Filter Books**
- 📖 **Rent and Return Books**
- 🧠 **Smart Recommendation System** based on:
  - Genre preferences
  - Age group
  - Reading history
- ⚡ **Modern UI** built with ShadCN components (Tailwind + Radix)
- 🧾 **Admin Dashboard** to manage:
  - Books
  - Membership Plans
  - Users & Rentals
- 📊 **View Rental History**
- 📧 **Automated Email Notifications** when books are rented

---

## 🛠️ Tech Stack

| Layer        | Technology Description                    |
| ------------ | ----------------------------------------- |
| **Frontend** | React.js (Vite) + ShadCN/UI + TailwindCSS |
| **Backend**  | Node.js + Express.js + MongoDB            |
| **Database** | MongoDB Atlas                             |
| **Auth**     | JWT-based Authentication                  |
| **Email**    | Nodemailer (SMTP)                         |
| **Hosting**  | Vercel (Frontend + Serverless Backend)    |

---

## 🧠 Recommendation Engine

The system provides dynamic recommendations based on user preferences gathered during **sign-up**, including:

- Favorite genres
- Preferred reading language
- Age group

It also learns from user history to refine future recommendations.

---

## 🧩 Project Structure

\`\`\`
bookhub/
├── client/ # React frontend (Vite + ShadCN)
│ ├── src/
│ ├── public/
│ └── package.json
│
├── server/ # Express backend (Node.js)
│ ├── src/
│ │ ├── api/
│ │ ├── database/
│ │ ├── middleware/
│ │ └── server.js
│ └── package.json
│
├── vercel.json # Vercel configuration for serverless deployment
└── README.md
\`\`\`

---

## 🧪 Setup Instructions (Local Development)

### 1️⃣ Clone the Repository

\`\`\`bash
git clone https://github.com/a-proton/bookhub.git
cd bookhub
\`\`\`

---

### 2️⃣ Setup Environment Variables

Create a `.env` file inside **`server/`**:

\`\`\`bash

# --- Backend Configuration ---

PORT=5000

# --- Database ---

MONGODB_URI=your_mongodb_connection_string

# --- Authentication ---

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_EXPIRE=7d

# --- Admin Credentials ---

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

# --- URLs ---

FRONTEND_URL=http://localhost:5173

# --- Email Configuration ---

EMAIL_HOST=smtp.yourmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password
EMAIL_FROM="BookHub <noreply@bookhub.com>"
\`\`\`

---

### 3️⃣ Install Dependencies

#### Install frontend dependencies:

\`\`\`bash
cd client
npm install
\`\`\`

#### Install backend dependencies:

\`\`\`bash
cd ../server
npm install
\`\`\`

---

### 4️⃣ Run the Project Locally

#### Start the frontend:

\`\`\`bash
cd client
npm run dev
\`\`\`

#### Start the backend:

\`\`\`bash
cd ../server
npm start
\`\`\`

Your app should now be running at:

- Frontend → http://localhost:5173
- Backend → http://localhost:3000

---

## 🌍 Deployment

This project is fully deployed on **Vercel**, using a **serverless Express backend** and a static React frontend.

- **Frontend URL:**  
  [https://bookhubrentalplatform.vercel.app/](https://bookhubrentalplatform.vercel.app/)
- **API Base URL (Serverless):**  
  \`https://bookhubrentalplatform.vercel.app/api\`

---

## 💡 Example API Endpoint

Test if the backend is live:
\`\`\`
GET https://bookhubrentalplatform.vercel.app/api/health
\`\`\`

Response:
\`\`\`json
{
"status": "ok",
"message": "BookHub Server is running",
"timestamp": "2025-10-21T16:30:00Z"
}
\`\`\`

---

## 🧑‍💻 Author

**Avinash Gautam**  
 [a-proton](https://github.com/a-proton)
 for any kind of help during running please feel free to contact me at "contactbookhub123@gmail.com"
