# ChatHub

A full-stack real-time messaging web application inspired by Discord. Users register, create servers with text channels, send messages that appear instantly for everyone in the channel, and hold private one-on-one direct message conversations. Message delivery, typing indicators and online/offline presence all run over WebSockets on top of JWT-authenticated sessions, with full history persisted in MongoDB.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [Deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

You need Node.js 18 or newer and a MongoDB instance (local or Atlas).

```
node --version      # v18.0.0 or newer
npm --version
mongod --version    # or an Atlas connection string
```

If you do not have MongoDB locally, install it with Homebrew:

```
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Installing

Clone the repository and install dependencies for both halves of the app.

```
git clone https://github.com/EhsanKabeer/Discord-clone.git
cd Discord-clone
```

Install the server dependencies:

```
cd server
npm install
```

Create `server/.env` with your configuration:

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/discord-clone
JWT_SECRET=replace-with-a-long-random-string
CLIENT_URL=http://localhost:3000
```

Install the client dependencies:

```
cd ../client
npm install
```

Run the two halves in separate terminals. Server first:

```
cd server
npm run dev
```

Then the client:

```
cd client
npm start
```

Open `http://localhost:3000`, register an account, and create a server. To see messages arriving live, open a second browser profile, register a second account, join the same server and send a message — it appears in the first window without a refresh.

## Running the tests

The client is set up with the React Testing Library harness that ships with Create React App.

```
cd client
npm test
```

### Break down into end to end tests

The real-time behaviour is what is worth exercising end to end, because it is the part that cannot be verified from a single client. The manual pass is: open two authenticated sessions against the same channel, confirm a message sent from one renders in the other without a reload, confirm the typing indicator appears and then clears, and confirm the sender's presence dot flips to offline when their socket disconnects.

```
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm start

# then open http://localhost:3000 in two separate browser profiles
```

### And coding style tests

Linting runs through the Create React App ESLint configuration as part of the client build, so a style regression fails the build rather than passing silently.

```
cd client
npm run build
```

## Deployment

The server is a plain Node process and deploys to any host that can run one — Railway, Render, Fly.io or a VM. Set `PORT`, `MONGODB_URI`, `JWT_SECRET` and `CLIENT_URL` in the host's environment rather than committing a `.env`, and point `MONGODB_URI` at a managed MongoDB Atlas cluster.

The client builds to static assets and can be served from any static host:

```
cd client
npm run build
```

Two things matter in production. `CLIENT_URL` must match the deployed frontend origin exactly, or CORS will reject the WebSocket upgrade. And the host must support WebSockets — platforms that only proxy plain HTTP will silently downgrade Socket.io to long-polling, which works but loses the latency the app is built around.

## Built With

* [React](https://react.dev/) - Frontend UI, with React Router for navigation
* [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/) - REST API and server runtime
* [Socket.io](https://socket.io/) - WebSocket transport for messaging, typing indicators and presence
* [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) - Message, channel, server and user persistence
* [JSON Web Tokens](https://jwt.io/) - Stateless session authentication
* [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing

## Contributing

This is a personal portfolio project and is not accepting contributions, but you are welcome to fork it and build on it.

## Versioning

This project does not use formal version tags. History is tracked through the commit log on the [repository](https://github.com/EhsanKabeer/Discord-clone).

## Authors

* **Ehsan Kabeer** - *Initial work* - [EhsanKabeer](https://github.com/EhsanKabeer)

## License

No license has been specified for this project.

## Acknowledgments

* Discord, for the interaction model this project reimplements
* The Socket.io documentation, particularly the rooms and namespaces guide, which shaped how channels are modelled
