const fs = require('fs');
const path = require('path');
const sql = require('./db');
const { initializeDatabase } = require('./schema');

async function migrateData() {
  try {
    console.log('Initializing database schema...');
    await initializeDatabase();

    const doctorsFile = path.join(__dirname, '..', 'data', 'doctors.json');
    const patientsFile = path.join(__dirname, '..', 'data', 'patients.json');

    // Migrate doctors
    if (fs.existsSync(doctorsFile)) {
      let doctorsContent = fs.readFileSync(doctorsFile, 'utf8');
      // Remove comment markers if present (/*[ at start, */ at end)
      doctorsContent = doctorsContent.trim();
      if (doctorsContent.startsWith('/*[')) {
        doctorsContent = doctorsContent.substring(2); // Remove /*
      }
      if (doctorsContent.endsWith('*/')) {
        doctorsContent = doctorsContent.substring(0, doctorsContent.length - 2); // Remove */
      }
      const doctors = JSON.parse(doctorsContent);
      console.log(`Migrating ${doctors.length} doctors...`);

      for (const doctor of doctors) {
        // Check if user already exists
        const existing = await sql`
          SELECT id FROM users WHERE username = ${doctor.username}
        `;

        if (existing.length === 0) {
          await sql`
            INSERT INTO users (
              username, password, user_type, department,
              working_days, start_time, end_time, duration
            ) VALUES (
              ${doctor.username},
              ${doctor.password},
              'doctor',
              ${doctor.department},
              ${doctor.workingDays || [1, 2, 3, 4, 5]},
              ${doctor.startTime || '09:00'},
              ${doctor.endTime || '17:00'},
              ${doctor.duration || 30}
            )
          `;

          console.log(`Migrated doctor: ${doctor.username}`);
        } else {
          console.log(`Doctor ${doctor.username} already exists, skipping...`);
        }
      }

      // Migrate appointments for doctors
      // We'll do this after patients are migrated
    }

    // Migrate patients first (needed for appointments)
    if (fs.existsSync(patientsFile)) {
      let patientsContent = fs.readFileSync(patientsFile, 'utf8');
      // Remove comment markers if present (/*[ at start, */ at end)
      patientsContent = patientsContent.trim();
      if (patientsContent.startsWith('/*[')) {
        patientsContent = patientsContent.substring(2); // Remove /*
      }
      if (patientsContent.endsWith('*/')) {
        patientsContent = patientsContent.substring(0, patientsContent.length - 2); // Remove */
      }
      const patients = JSON.parse(patientsContent);
      console.log(`Migrating ${patients.length} patients...`);

      for (const patient of patients) {
        // Check if user already exists
        const existing = await sql`
          SELECT id FROM users WHERE username = ${patient.username}
        `;

        if (existing.length === 0) {
          await sql`
            INSERT INTO users (
              username, password, user_type,
              first_name, last_name, dob, card_id, card_expiry
            ) VALUES (
              ${patient.username},
              ${patient.password},
              'patient',
              ${patient.firstName || patient.firstname},
              ${patient.lastName || patient.lastname},
              ${patient.dob},
              ${patient.cardId || patient.cardid},
              ${patient.cardExpiry || patient.cardexpiry}
            )
            RETURNING id
          `;

          console.log(`Migrated patient: ${patient.username}`);
        } else {
          console.log(`Patient ${patient.username} already exists, skipping...`);
        }
      }
    }

    // Now migrate appointments from doctors
    if (fs.existsSync(doctorsFile)) {
      let doctorsContent = fs.readFileSync(doctorsFile, 'utf8');
      // Remove comment markers if present (/*[ at start, */ at end)
      doctorsContent = doctorsContent.trim();
      if (doctorsContent.startsWith('/*[')) {
        doctorsContent = doctorsContent.substring(2); // Remove /*
      }
      if (doctorsContent.endsWith('*/')) {
        doctorsContent = doctorsContent.substring(0, doctorsContent.length - 2); // Remove */
      }
      const doctors = JSON.parse(doctorsContent);
      
      for (const doctor of doctors) {
        if (!doctor.appointments || doctor.appointments.length === 0) continue;

        const doctorUser = await sql`
          SELECT id FROM users WHERE username = ${doctor.username} AND user_type = 'doctor'
        `;
        if (doctorUser.length === 0) continue;

        const doctorId = doctorUser[0].id;

        for (const apt of doctor.appointments) {
          // Find patient by old ID from JSON or by name
          let patientId;
          
          // Try to find by old ID first (stored as string in JSON)
          if (apt.patientId) {
            // The old ID was a timestamp string, we need to find the patient by username
            // Since we can't match old IDs, we'll try to find by patient name
            const patientNameParts = apt.patientName?.split(' ') || [];
            if (patientNameParts.length >= 2) {
              const firstName = patientNameParts[0];
              const lastName = patientNameParts.slice(1).join(' ');
              
              const patient = await sql`
                SELECT id FROM users 
                WHERE first_name = ${firstName} 
                AND last_name = ${lastName}
                AND user_type = 'patient'
                LIMIT 1
              `;
              if (patient.length > 0) {
                patientId = patient[0].id;
              }
            }
          }

          // If still not found, try to find any patient (fallback)
          if (!patientId && apt.patientName && apt.patientName !== 'undefined undefined') {
            const allPatients = await sql`
              SELECT id FROM users WHERE user_type = 'patient' LIMIT 1
            `;
            if (allPatients.length > 0) {
              patientId = allPatients[0].id;
            }
          }

          if (patientId) {
            // Check if appointment already exists
            const existing = await sql`
              SELECT id FROM appointments 
              WHERE patient_id = ${patientId} 
              AND doctor_id = ${doctorId}
              AND date = ${apt.date}
              AND time = ${apt.time}
            `;

            if (existing.length === 0) {
              await sql`
                INSERT INTO appointments (
                  patient_id, doctor_id, patient_name, doctor_name,
                  department, date, time, notes, status
                ) VALUES (
                  ${patientId},
                  ${doctorId},
                  ${apt.patientName || 'Unknown Patient'},
                  ${apt.doctorName || doctor.username},
                  ${apt.department || doctor.department},
                  ${apt.date},
                  ${apt.time},
                  ${apt.notes || ''},
                  ${apt.status || 'pending'}
                )
              `;
              console.log(`  Migrated appointment: ${apt.date} at ${apt.time}`);
            }
          } else {
            console.log(`  Warning: Could not find patient for appointment ${apt.date} ${apt.time}`);
          }
        }
      }
    }

    // Also migrate appointments from patients file
    if (fs.existsSync(patientsFile)) {
      let patientsContent = fs.readFileSync(patientsFile, 'utf8');
      // Remove comment markers if present (/*[ at start, */ at end)
      patientsContent = patientsContent.trim();
      if (patientsContent.startsWith('/*[')) {
        patientsContent = patientsContent.substring(2); // Remove /*
      }
      if (patientsContent.endsWith('*/')) {
        patientsContent = patientsContent.substring(0, patientsContent.length - 2); // Remove */
      }
      const patients = JSON.parse(patientsContent);
      
      for (const patient of patients) {
        if (!patient.appointments || patient.appointments.length === 0) continue;

        const patientUser = await sql`
          SELECT id FROM users WHERE username = ${patient.username} AND user_type = 'patient'
        `;
        if (patientUser.length === 0) continue;

        const patientId = patientUser[0].id;

        for (const apt of patient.appointments) {
          // Find doctor by username
          const doctorName = apt.doctorName?.replace('Dr. ', '').trim() || '';
          const doctorUser = await sql`
            SELECT id FROM users WHERE username = ${doctorName} AND user_type = 'doctor'
            LIMIT 1
          `;
          
          if (doctorUser.length > 0) {
            const doctorId = doctorUser[0].id;

            // Check if appointment already exists
            const existing = await sql`
              SELECT id FROM appointments 
              WHERE patient_id = ${patientId} 
              AND doctor_id = ${doctorId}
              AND date = ${apt.date}
              AND time = ${apt.time}
            `;

            if (existing.length === 0) {
              await sql`
                INSERT INTO appointments (
                  patient_id, doctor_id, patient_name, doctor_name,
                  department, date, time, notes, status
                ) VALUES (
                  ${patientId},
                  ${doctorId},
                  ${apt.patientName || `${patient.firstName || patient.firstname} ${patient.lastName || patient.lastname}`},
                  ${apt.doctorName || doctorName},
                  ${apt.department},
                  ${apt.date},
                  ${apt.time},
                  ${apt.notes || ''},
                  ${apt.status || 'pending'}
                )
              `;
              console.log(`  Migrated patient appointment: ${apt.date} at ${apt.time}`);
            }
          }
        }
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('Migration finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };
