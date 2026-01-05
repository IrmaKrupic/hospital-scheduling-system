const db = require('./db');

async function initializeDatabase() {
  try {
    // Create users table (unified for doctors and patients)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('doctor', 'patient')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Doctor-specific fields
        department VARCHAR(255),
        working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
        start_time VARCHAR(10) DEFAULT '09:00',
        end_time VARCHAR(10) DEFAULT '17:00',
        duration INTEGER DEFAULT 30,
        -- Patient-specific fields
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        dob DATE,
        card_id VARCHAR(255),
        card_expiry DATE
      )
    `);

    // Create appointments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        doctor_name VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time VARCHAR(10) NOT NULL,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  
    // Create indexes for better query performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date)
    `);
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
}

module.exports = { initializeDatabase };
