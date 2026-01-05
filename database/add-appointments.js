require('dotenv').config();
const sql = require('./db');

async function addAppointmentsForDrIrma() {
  try {
    console.log('Adding appointments for Dr. Irma...');

    // Find Dr. Irma
    const doctors = await sql`
      SELECT id, username FROM users WHERE username = 'Irma' AND user_type = 'doctor'
    `;

    if (doctors.length === 0) {
      console.error('Dr. Irma not found in database!');
      return;
    }

    const doctorId = doctors[0].id;
    console.log(`Found Dr. Irma with ID: ${doctorId}`);

    // Find all patients
    const patients = await sql`
      SELECT id, first_name, last_name FROM users WHERE user_type = 'patient'
    `;

    if (patients.length === 0) {
      console.error('No patients found in database!');
      return;
    }

    const patientId = patients[0].id;
    const patientName = `${patients[0].first_name || ''} ${patients[0].last_name || ''}`.trim() || 'Unknown Patient';

    console.log(`Using patient: ${patientName} (ID: ${patientId})`);

    // Get current date
    const today = new Date();
    const dates = [];
    
    // Create appointments for the next 2 weeks
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Only add appointments on working days (Tue, Wed, Thu - days 2, 3, 4)
      if ([2, 3, 4].includes(dayOfWeek)) {
        dates.push({
          date: date.toISOString().split('T')[0],
          times: i % 3 === 0 ? ['10:00', '11:00'] : ['09:00', '14:00'] // Mix of times
        });
      }
    }

    let addedCount = 0;
    let skippedCount = 0;
    let appointmentIndex = 0;

    for (const { date, times } of dates) {
      for (const time of times) {
        // Check if appointment already exists
        const existing = await sql`
          SELECT id FROM appointments 
          WHERE doctor_id = ${doctorId}
          AND date = ${date}
          AND time = ${time}
        `;

        if (existing.length > 0) {
          skippedCount++;
          continue;
        }

        // Randomly set status - some pending, some approved
        const statuses = ['pending', 'pending', 'approved', 'pending', 'approved'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Add notes occasionally
        const notes = appointmentIndex % 3 === 0 ? 'Regular checkup' : '';

        await sql`
          INSERT INTO appointments (
            patient_id, doctor_id, patient_name, doctor_name,
            department, date, time, notes, status
          ) VALUES (
            ${patientId},
            ${doctorId},
            ${patientName},
            ${'Irma'},
            ${'Family Medicine'},
            ${date},
            ${time},
            ${notes},
            ${status}
          )
        `;

        addedCount++;
        appointmentIndex++;
        console.log(`Added appointment: ${date} at ${time} (${status})`);
      }
    }

    console.log(`\n✅ Successfully added ${addedCount} appointments`);
    console.log(`⏭️  Skipped ${skippedCount} existing appointments`);

  } catch (error) {
    console.error('Error adding appointments:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addAppointmentsForDrIrma()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { addAppointmentsForDrIrma };
