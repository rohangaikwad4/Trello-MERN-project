# Trello Clone

A full-stack project management app with organizations, boards, and a Kanban-style issue tracker.

## Features

- User authentication (signup / signin) with JWT
- Create and manage organizations with members
- Create boards within organizations
- Drag-free Kanban: click issues to cycle through todo → in-progress → done
- Role-based access: only admins can add/remove members

## Tech Stack

**Backend:** Node.js, Express 5, Mongoose, JWT, dotenv
**Frontend:** Vanilla JavaScript, HTML5, CSS3
**Database:** MongoDB Atlas

## How to Run

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/rohangaikwad4/Trello-MERN-project.git
   cd Trello-MERN-project
   npm install
   ```

2. Create a `.env` file based on `.env.example` and add your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string_here
   ```

3. Start the server:
   ```bash
   node index.js
   ```

4. Open `http://localhost:3000` in your browser.