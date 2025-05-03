# ChatHub

ChatHub is a full-stack real-time messaging web application inspired by Discord. Users can register, create servers with text channels, send messages that appear instantly for everyone in the channel, and have private one-on-one direct message conversations. The project was built from scratch as a portfolio piece to demonstrate full-stack JavaScript development.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, React Router, Socket.io Client, Axios, CSS3 |
| Backend | Node.js, Express.js, Socket.io, JWT, Bcrypt |
| Database | MongoDB with Mongoose |

---

## Features

- User registration and login with JWT-based authentication
- Create and browse servers (workspaces)
- Text channels within each server
- Real-time messaging powered by WebSockets
- Direct messages between any two users
- Live typing indicators and online/offline status
- Persistent message history stored in MongoDB
- Dark theme UI

---

## How It Works

The backend is a Node.js/Express REST API that handles authentication, server and channel management, and message history. Real-time events (sending messages, typing indicators, presence updates) go through Socket.io, which runs on the same server alongside Express.

User passwords are hashed with bcrypt before being stored. On login, the server returns a signed JWT that the client stores and attaches to every API request. The same token is used to authenticate the Socket.io connection, so only logged-in users can send or receive messages.

MongoDB stores all application data through five collections: Users, Servers, Channels, Messages, and DMs. Mongoose schemas define validation rules and handle things like automatically hashing passwords and updating timestamps when a message is edited. Channel messages and direct messages share one Message collection, with a field indicating which type each document belongs to.

The React frontend is organized around context providers for auth, socket state, and notifications. When a user opens a channel, the client fetches message history from the REST API and then subscribes to the Socket.io room for that channel. New messages arrive through the socket and are appended to the local state without a page reload.
