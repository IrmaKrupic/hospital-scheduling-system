# Hospital Scheduling System

A React-based hospital scheduling application with Neon PostgreSQL database integration.

## Features

- Unified authentication system (doctors and patients)
- User type stored in database (no separate login pages)
- PostgreSQL database with Neon integration
- Appointment scheduling system
- Doctor and patient dashboards

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Neon Database

1. Create an account at [Neon](https://neon.tech/)
2. Create a new project and database
3. Copy your database connection string

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
PORT=3001
```

Replace the `DATABASE_URL` with your actual Neon database connection string.

### 4. Initialize Database

Run the migration script to create tables and migrate existing data:

```bash
npm run migrate
```

This will:
- Create the database schema (users and appointments tables)
- Migrate existing data from `data/doctors.json` and `data/patients.json`

### 5. Start the Server

In one terminal:

```bash
node server.js
```

The server will run on `http://localhost:3001`

### 6. Start the React App

In another terminal:

```bash
npm start
```

The React app will run on `http://localhost:3002`

## Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `username` (VARCHAR, UNIQUE)
- `password` (VARCHAR)
- `user_type` (VARCHAR) - 'doctor' or 'patient'
- `department` (VARCHAR) - For doctors
- `working_days` (INTEGER[]) - For doctors
- `start_time` (VARCHAR) - For doctors
- `end_time` (VARCHAR) - For doctors
- `duration` (INTEGER) - For doctors
- `first_name` (VARCHAR) - For patients
- `last_name` (VARCHAR) - For patients
- `dob` (DATE) - For patients
- `card_id` (VARCHAR) - For patients
- `card_expiry` (DATE) - For patients

### Appointments Table
- `id` (SERIAL PRIMARY KEY)
- `patient_id` (INTEGER, FOREIGN KEY)
- `doctor_id` (INTEGER, FOREIGN KEY)
- `patient_name` (VARCHAR)
- `doctor_name` (VARCHAR)
- `department` (VARCHAR)
- `date` (DATE)
- `time` (VARCHAR)
- `notes` (TEXT)
- `status` (VARCHAR) - 'pending', 'approved', 'rejected', 'cancelled'

## API Endpoints

### Unified Authentication
- `POST /api/login` - Login (returns user with user_type)
- `POST /api/signup` - Signup (requires userType in body)

### Legacy Endpoints (still supported)
- `POST /api/doctor/login`
- `POST /api/doctor/signup`
- `POST /api/patient/login`
- `POST /api/patient/signup`

## Project Structure

```
hospital-scheduling-react/
├── database/
│   ├── db.js          # Database connection
│   ├── schema.js      # Database schema definition
│   └── migrate.js     # Migration script
├── data/
│   ├── doctors.json   # Existing doctor data (to be migrated)
│   └── patients.json  # Existing patient data (to be migrated)
├── src/
│   ├── components/
│   │   ├── Login.js   # Unified login component
│   │   ├── Signup.js  # Unified signup component
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.js
│   └── services/
│       └── api.js
└── server.js          # Express server
```

## Notes

- User type (doctor/patient) is now stored in the database
- Unified login/signup pages - no separate doctor/patient selection
- All data is stored in PostgreSQL via Neon
- Legacy routes are maintained for backward compatibility
