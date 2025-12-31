# Quiz Game Project

A full-featured Quiz Game application built with Node.js, Express, and SQLite. It features a comprehensive Admin Panel for managing content and a responsive Player Interface with game progression, hearts, stars, and an item store.

## Features

### User Features
- **Categorized Stages**: Unlock categories and progress through stages.
- **Game Mechanics**: Hearts system, Stars rating, Timer, and Hints.
- **Store**: Purchase Hearts, Infinite Hearts Boosts, and Hints using Stars.
- **Daily Rewards**: Daily login streak rewards (Stars, Hearts, Boosts).
- **Profile**: Track progress, level, and XP.
- **Responsive Design**: Mobile-friendly UI.

### Admin Features
- **Dashboard**: View key statistics (Players, Stars, Content counts).
- **Content Management**: Create/Edit/Delete Categories, Stages, and Questions.
- **User Management**: View users, ban/unban, and manage player resources manually.
- **Daily Rewards**: Configure daily login rewards.
- **Levels**: Configure XP thresholds for levels.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (Promisified wrapper)
- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Authentication**: Session-based (express-session), BCrypt for admin passwords.

## Installation

1.  **Clone the repository** (or extract files).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    SESSION_SECRET=your-secret-key-complex-string
    ```
4.  **Database Initialization**:
    The database (`quiz.db`) will be automatically created and initialized with the schema upon the first run if it doesn't exist.
    A default admin account is created:
    - Username: `admin`
    - Password: `admin` (Change this immediately after login!)

## Running the Application

To start the server:

```bash
npm start
```

The application will be available at:
- **Game**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3000/admin`

## Project Structure

- `server.js`: Main entry point.
- `database.js`: Database connection and schema initialization.
- `routes/`: API routes (Auth, Game, Admin, etc.).
- `middleware/`: Express middleware (Auth checks).
- `scripts/`: Utility scripts (Seed, Fix, Debug).
- `public/`: Frontend assets.
  - `admin/`: Admin panel source.
  - `js/`: Modularized game frontend logic.
    - `main.js`: Entry point.
    - `api.js`: API wrapper.
    - `game.js`, `ui.js`, `store.js`, `state.js`: Feature modules.

## Scripts

- `npm start`: Run the server.
- `npm run seed:stages`: Seed initial stages data.
- `npm run reset:admin`: Reset admin password (if script present).

## License

MIT
