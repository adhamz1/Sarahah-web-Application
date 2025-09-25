## Sarahah - Anonymous Messaging Web Application
Welcome to Sarahah, an anonymous messaging application where users can send and receive honest feedback and messages without revealing their identity. This project is built using the MERN stack (MongoDB, Express.js, React/Angular/Vue, Node.js), providing a robust and scalable backend.

This application allows users to create a profile, share their unique link, and receive anonymous messages from friends, colleagues, or anyone with the link.

## Features
User Authentication: Secure user registration and login using JSON Web Tokens (JWT).

Anonymous Messaging: Send messages to any registered user without revealing your identity.

View Messages: Users can view all the anonymous messages they have received in a personal dashboard.

Shareable Profile Links: Each user gets a unique URL to share on social media to invite messages.

Password Hashing: User passwords are securely hashed using bcryptjs before being stored.

API Rate Limiting: Basic protection against brute-force attacks.

## Technology Stack
Backend: Node.js, Express.js

Database: MongoDB with Mongoose ODM

Authentication: JSON Web Tokens (JWT)

Password Hashing: bcryptjs

Validation: Joi or express-validator

Environment Variables: dotenv

## Prerequisites
Before you begin, ensure you have the following installed on your local machine:

Node.js (v14 or higher is recommended)

npm (Node Package Manager)

MongoDB (either local instance or a cloud-hosted one like MongoDB Atlas)

## Installation and Setup
Follow these steps to get the application running on your local machine.

Clone the repository:

Bash

git clone https://github.com/your-username/sarahah-backend.git
cd sarahah-backend
Install dependencies:

Bash

npm install
Set up environment variables:
Create a .env file in the root of your project and add the following configuration. Replace the placeholder values with your actual data.

Code snippet

# Port for the server to run on
PORT=3000

# Your MongoDB connection string
DB_CONNECTION_STRING="your_mongodb_connection_string_here"

# Secret key for signing JWTs (use a long, random string)
JWT_SECRET="your_super_secret_jwt_key"

# The base URL of your frontend application (for CORS)
FRONTEND_BASE_URL="http://localhost:5173"
Start the development server:

Bash

npm run dev
The server should now be running on the port you specified in your .env file (e.g., http://localhost:3000).

## API Endpoints
Here are the primary API routes available in this application:

Method	Endpoint	Description
POST	/api/v1/auth/signup	Register a new user.
POST	/api/v1/auth/login	Log in an existing user.
POST	/api/v1/message/:userId	Send an anonymous message to a user.
GET	/api/v1/message/	Get all received messages for the logged-in user.
GET	/api/v1/user/profile	Get the profile of the logged-in user.
