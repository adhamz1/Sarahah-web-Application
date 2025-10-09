# 💬 Sarahah Web App (Backend)

A Node.js backend for the **Sarahah-style anonymous messaging web application**, allowing users to register, log in, and receive anonymous messages from others.  
This project is built using **Express.js**, **MongoDB**, and **JWT authentication**, following clean architecture and modular structure.

---

## 🚀 Features

- 🔐 **User Authentication** (Register, Login, Logout using JWT)
- 💌 **Anonymous Messaging System** (Send & receive messages without revealing the sender)
- 🧾 **Message Management** (List, delete, or report messages)
- ⚙️ **Secure API** using validation, encryption, and middleware
- 🗄️ **MongoDB Database Integration**
- 📁 **Clean Folder Structure** for scalability and maintainability

---

## 🏗️ Project Structure

├── src/
│ ├── config/ # Database & environment setup
│ ├── middlewares/ # Authentication & validation middleware
│ ├── modules/
│ │ ├── user/
│ │ │ ├── user.controller.js
│ │ │ ├── user.service.js
│ │ │ └── user.model.js
│ │ ├── message/
│ │ │ ├── message.controller.js
│ │ │ ├── message.service.js
│ │ │ └── message.model.js
│ ├── routes/ # All app routes combined
│ ├── utils/ # Helper functions (encryption, token handling, etc.)
│ └── index.js # App entry point
├── .env # Environment variables
├── package.json
└── README.md


---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/sarahah-backend.git
cd sarahah-backend
npm install
npm start




🧩 API Endpoints
👤 User Routes

| Method | Endpoint              | Description             |
| ------ | --------------------- | ----------------------- |
| POST   | `/api/users/register` | Register a new user     |
| POST   | `/api/users/login`    | Login and get JWT       |
| GET    | `/api/users/profile`  | Get user profile (auth) |



💌 Message Routes
| Method | Endpoint                     | Description                  |
| ------ | ---------------------------- | ---------------------------- |
| POST   | `/api/messages/send/:userId` | Send an anonymous message    |
| GET    | `/api/messages`              | Get received messages (auth) |
| DELETE | `/api/messages/:id`          | Delete a message (auth)      |


🧠 Tech Stack

Node.js – Server environment

Express.js – Web framework

MongoDB – NoSQL database

Mongoose – ODM for MongoDB

JWT – Authentication

bcrypt – Password hashing

dotenv – Environment variables

🧾 License

This project is licensed under the MIT License.
