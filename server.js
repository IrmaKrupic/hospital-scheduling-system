const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sql = require('./database/db');
const { initializeDatabase } = require('./database/schema');

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database on startup (silently - uses IF NOT EXISTS so won't recreate if exists)
(async () => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
})();

// Helper function to format user response
function formatUserResponse(user) {
  const response = {
    id: user.id.toString(),
    username: user.username,
    userType: user.user_type
  };

  if (user.user_type === 'doctor') {
    response.department = user.department;
    response.workingDays = user.working_days || [1, 2, 3, 4, 5];
    response.startTime = user.start_time || '09:00';
    response.endTime = user.end_time || '17:00';
    response.duration = user.duration || 30;
  } else if (user.user_type === 'patient') {
    response.firstName = user.first_name;
    response.lastName = user.last_name;
    response.firstname = user.first_name;
    response.lastname = user.last_name;
    response.dob = user.dob;
    response.cardId = user.card_id;
    response.cardid = user.card_id;
    response.cardExpiry = user.card_expiry;
    response.cardexpiry = user.card_expiry;
  }

  return response;
}

// Helper function to format appointment response
function formatAppointmentResponse(apt) {
  return {
    id: apt.id.toString(),
    patientId: apt.patient_id.toString(),
    patientName: apt.patient_name,
    doctorId: apt.doctor_id.toString(),
    doctorName: apt.doctor_name,
    department: apt.department,
    date: apt.date,
    time: apt.time,
    notes: apt.notes || '',
    status: apt.status
  };
}

// ========== UNIFIED AUTHENTICATION ROUTES ==========

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Unified Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const users = await sql`
      SELECT * FROM users WHERE username = ${username} AND password = ${password}
    `;

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = users[0];
    const userResponse = formatUserResponse(user);

    res.json({
      success: true,
      message: 'Login successful!',
      user: userResponse,
      userType: user.user_type
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
});

// Unified Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, userType, ...otherData } = req.body;

    if (!userType || !['doctor', 'patient'].includes(userType)) {
      return res.status(400).json({ success: false, message: 'Invalid user type' });
    }

    // Check if username exists
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    let newUser;

    if (userType === 'doctor') {
      const { department } = otherData;
      const result = await sql`
        INSERT INTO users (
          username, password, user_type, department,
          working_days, start_time, end_time, duration
        ) VALUES (
          ${username},
          ${password},
          'doctor',
          ${department},
          ${[1, 2, 3, 4, 5]},
          ${'09:00'},
          ${'17:00'},
          ${30}
        )
        RETURNING *
      `;
      newUser = result[0];
    } else {
      const { firstname, lastname, dob, cardid, cardexpiry } = otherData;
      const result = await sql`
        INSERT INTO users (
          username, password, user_type,
          first_name, last_name, dob, card_id, card_expiry
        ) VALUES (
          ${username},
          ${password},
          'patient',
          ${firstname},
          ${lastname},
          ${dob},
          ${cardid},
          ${cardexpiry}
        )
        RETURNING *
      `;
      newUser = result[0];
    }

    const userResponse = formatUserResponse(newUser);

    res.json({
      success: true,
      message: 'Account created successfully!',
      user: userResponse,
      userType: userResponse.userType
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during signup' });
  }
});

// ========== LEGACY ROUTES (for backward compatibility) ==========

app.post('/api/doctor/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await sql`
      SELECT * FROM users 
      WHERE username = ${username} AND password = ${password} AND user_type = 'doctor'
    `;

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = users[0];
    const doctor = formatUserResponse(user);
    res.json({ success: true, message: 'Login successful!', doctor });
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
});

app.post('/api/doctor/signup', async (req, res) => {
  try {
    const { username, password, department } = req.body;

    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const result = await sql`
      INSERT INTO users (
        username, password, user_type, department,
        working_days, start_time, end_time, duration
      ) VALUES (
        ${username}, ${password}, 'doctor', ${department},
        ${[1, 2, 3, 4, 5]}, ${'09:00'}, ${'17:00'}, ${30}
      )
      RETURNING *
    `;

    const doctor = formatUserResponse(result[0]);
    res.json({ success: true, message: 'Doctor account created successfully!', doctor });
  } catch (error) {
    console.error('Doctor signup error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during signup' });
  }
});

app.post('/api/patient/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await sql`
      SELECT * FROM users 
      WHERE username = ${username} AND password = ${password} AND user_type = 'patient'
    `;

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = users[0];
    const patient = formatUserResponse(user);
    res.json({ success: true, message: 'Login successful!', patient });
  } catch (error) {
    console.error('Patient login error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
});

app.post('/api/patient/signup', async (req, res) => {
  try {
    const { username, password, firstname, lastname, dob, cardid, cardexpiry } = req.body;

    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const result = await sql`
      INSERT INTO users (
        username, password, user_type,
        first_name, last_name, dob, card_id, card_expiry
      ) VALUES (
        ${username}, ${password}, 'patient',
        ${firstname}, ${lastname}, ${dob}, ${cardid}, ${cardexpiry}
      )
      RETURNING *
    `;

    const patient = formatUserResponse(result[0]);
    res.json({ success: true, message: 'Patient account created successfully!', patient });
  } catch (error) {
    console.error('Patient signup error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during signup' });
  }
});

// ========== DOCTOR ROUTES ==========

app.get('/api/doctor/:doctorId/appointments', async (req, res) => {
  try {
    const appointments = await sql`
      SELECT * FROM appointments 
      WHERE doctor_id = ${parseInt(req.params.doctorId)}
      ORDER BY date, time
    `;

    res.json({
      success: true,
      appointments: appointments.map(formatAppointmentResponse)
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ success: false, message: 'Error fetching appointments' });
  }
});

app.post('/api/doctor/:doctorId/appointments', async (req, res) => {
  try {
    const { patientId, date, time, notes } = req.body;
    const doctorId = parseInt(req.params.doctorId);

    // Get doctor and patient info
    const [doctor, patient] = await Promise.all([
      sql`SELECT * FROM users WHERE id = ${doctorId} AND user_type = 'doctor'`,
      sql`SELECT * FROM users WHERE id = ${parseInt(patientId)} AND user_type = 'patient'`
    ]);

    if (doctor.length === 0 || patient.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor or patient not found' });
    }

    const doctorData = doctor[0];
    const patientData = patient[0];
    const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() || patientData.username;

    const result = await sql`
      INSERT INTO appointments (
        patient_id, doctor_id, patient_name, doctor_name,
        department, date, time, notes, status
      ) VALUES (
        ${parseInt(patientId)},
        ${doctorId},
        ${patientName},
        ${`Dr. ${doctorData.username}`},
        ${doctorData.department},
        ${date},
        ${time},
        ${notes || ''},
        'approved'
      )
      RETURNING *
    `;

    const appointment = formatAppointmentResponse(result[0]);
    res.json({ success: true, message: 'Appointment added successfully', appointment });
  } catch (error) {
    console.error('Add appointment error:', error);
    res.status(500).json({ success: false, message: 'Error adding appointment' });
  }
});

app.patch('/api/doctor/:doctorId/appointments/:appointmentId', async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = parseInt(req.params.appointmentId);

    const result = await sql`
      UPDATE appointments 
      SET status = ${status}
      WHERE id = ${appointmentId} AND doctor_id = ${parseInt(req.params.doctorId)}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, message: 'Appointment status updated' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ success: false, message: 'Error updating appointment' });
  }
});

app.delete('/api/doctor/:doctorId/appointments/:appointmentId', async (req, res) => {
  try {
    const result = await sql`
      DELETE FROM appointments 
      WHERE id = ${parseInt(req.params.appointmentId)} 
      AND doctor_id = ${parseInt(req.params.doctorId)}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ success: false, message: 'Error deleting appointment' });
  }
});

app.put('/api/doctor/:doctorId/working-hours', async (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId);
    const { workingDays, startTime, endTime, duration } = req.body;

    await sql`
      UPDATE users 
      SET working_days = ${workingDays},
          start_time = ${startTime},
          end_time = ${endTime},
          duration = ${duration}
      WHERE id = ${doctorId} AND user_type = 'doctor'
    `;

    res.json({ success: true, message: 'Working hours updated' });
  } catch (error) {
    console.error('Update working hours error:', error);
    res.status(500).json({ success: false, message: 'Error updating working hours' });
  }
});

app.get('/api/doctors/department/:department', async (req, res) => {
  try {
    const doctors = await sql`
      SELECT id, username, department, working_days, start_time, end_time, duration 
      FROM users 
      WHERE user_type = 'doctor' AND department = ${decodeURIComponent(req.params.department)}
    `;

    res.json({
      success: true,
      doctors: doctors.map(doc => ({
        id: doc.id.toString(),
        username: doc.username,
        department: doc.department,
        workingDays: doc.working_days,
        startTime: doc.start_time,
        endTime: doc.end_time,
        duration: doc.duration
      }))
    });
  } catch (error) {
    console.error('Get doctors by department error:', error);
    res.status(500).json({ success: false, message: 'Error fetching doctors' });
  }
});

// ========== PATIENT ROUTES ==========

app.get('/api/patient/:patientId/appointments', async (req, res) => {
  try {
    const appointments = await sql`
      SELECT * FROM appointments 
      WHERE patient_id = ${parseInt(req.params.patientId)}
      ORDER BY date, time
    `;

    res.json({
      success: true,
      appointments: appointments.map(formatAppointmentResponse)
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ success: false, message: 'Error fetching appointments' });
  }
});

app.post('/api/patient/:patientId/appointments', async (req, res) => {
  try {
    const { doctorId, date, time, notes } = req.body;
    const patientId = parseInt(req.params.patientId);

    // Get doctor and patient info
    const [doctor, patient] = await Promise.all([
      sql`SELECT * FROM users WHERE id = ${parseInt(doctorId)} AND user_type = 'doctor'`,
      sql`SELECT * FROM users WHERE id = ${patientId} AND user_type = 'patient'`
    ]);

    if (doctor.length === 0 || patient.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient or doctor not found' });
    }

    const doctorData = doctor[0];
    const patientData = patient[0];
    const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() || patientData.username;

    const result = await sql`
      INSERT INTO appointments (
        patient_id, doctor_id, patient_name, doctor_name,
        department, date, time, notes, status
      ) VALUES (
        ${patientId},
        ${parseInt(doctorId)},
        ${patientName},
        ${doctorData.username},
        ${doctorData.department},
        ${date},
        ${time},
        ${notes || ''},
        'pending'
      )
      RETURNING *
    `;

    const appointment = formatAppointmentResponse(result[0]);
    res.json({ success: true, message: 'Appointment booked successfully', appointment });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ success: false, message: 'Error booking appointment' });
  }
});

app.delete('/api/patient/:patientId/appointments/:appointmentId', async (req, res) => {
  try {
    const result = await sql`
      UPDATE appointments 
      SET status = 'cancelled'
      WHERE id = ${parseInt(req.params.appointmentId)} 
      AND patient_id = ${parseInt(req.params.patientId)}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ success: false, message: 'Error cancelling appointment' });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await sql`
      SELECT id, username, first_name, last_name 
      FROM users 
      WHERE user_type = 'patient'
    `;

    res.json({
      success: true,
      patients: patients.map(p => ({
        id: p.id.toString(),
        username: p.username,
        firstname: p.first_name,
        lastname: p.last_name,
        firstName: p.first_name,
        lastName: p.last_name,
        fullName: `${p.first_name || ''} ${p.last_name || ''}`.trim()
      }))
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Error fetching patients' });
  }
});

// Serve React build files - MUST be after all API routes
// Only serve static files if build directory exists (production)
const buildPath = path.join(__dirname, 'build');

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  
  // Serve React app for all other routes (for production)
  // In Express 5, use a catch-all middleware instead of app.get('*')
  app.use((req, res, next) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(buildPath, 'index.html'), (err) => {
        if (err) {
          next();
        }
      });
    } else {
      next();
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other server or use a different port.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
