# 📚 BookHub - Book Rental Platform

**BookHub** is a modern and user-friendly **Book Rental Platform** built using the **MERN stack (MongoDB, Express, React, Node.js)** along with **ShadCN UI components**. The platform allows users to browse, rent, and return books seamlessly, with a personalized recommendation system that suggests books based on user preferences provided during sign-up.

---

## 🚀 Features

- 🔐 **User Authentication & Authorization** (Login / Register)
- 📚 **Browse & Search Books**
- 📖 **Rent & Return Books**
- 🧠 **Smart Recommendations** based on:
  - Genre preferences
  - Age group
  - Reading history (if any)
- ⚡ **ShadCN UI** components for a clean, accessible, and responsive design
- 🧾 **Admin Dashboard** (Manage books,membership plan and many more)
- 📊 **Rental History **
- Email feature to the users when the book is rented

---

## 🛠 Tech Stack

| Technology     | Description                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| **MongoDB**    | NoSQL database to store user, book, and rental data                             |
| **Express.js** | Web framework for Node.js                                                       |
| **React.js**   | Frontend library for building the user interface                                |
| **Node.js**    | Backend runtime environment                                                     |
| **ShadCN/UI**  | Modern, accessible, and reusable UI components built on Radix UI + Tailwind CSS |

---

## 🔄 Recommendation System

The recommendation engine uses user data captured during the **sign-up process**, such as:

- Favorite genres
- Preferred reading language
- Age group

This data is analyzed to provide **smart, dynamic recommendations** tailored to each user.

## 🧪 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/a-proton/bookhub.git
cd bookhub
npm i

--- run npm install and npm run dev in one terminal to run frontend
--- npm start in another terminal for backend






Setup .env file like This


# --- Backend Server Configuration ---
PORT=5000

# --- Database ---
MONGODB_URI=
# --- Authentication & JWT ---
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRE=

# --- Admin Credentials ---
ADMIN_EMAIL=
ADMIN_PASSWORD=

# --- URLs ---
# The URL of your frontend, needed for CORS and redirects
FRONTEND_URL=http://localhost:5173

# --- SMTP Email Configuration ---
# Your server uses these credentials to send emails
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

```
