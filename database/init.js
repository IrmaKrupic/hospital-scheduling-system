const sql = require('./db');
const { initializeDatabase } = require('./schema');
const { migrateData } = require('./migrate');

async function init() {
  try {
    console.log('=== Starting Database Initialization ===');
    
    // Test connection first
    console.log('Testing database connection...');
    const testResult = await sql`SELECT NOW() as now`;
    console.log('✓ Database connection successful!');
    console.log('  Current time:', testResult[0].now);
    
    // Initialize schema
    console.log('\n=== Creating Tables ===');
    await initializeDatabase();
    console.log('✓ Tables created/verified successfully!');
    
    // Migrate data
    console.log('\n=== Migrating Data ===');
    await migrateData();
    console.log('✓ Data migration completed!');
    
    // Verify tables exist
    console.log('\n=== Verifying Tables ===');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Count records
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const appointmentCount = await sql`SELECT COUNT(*) as count FROM appointments`;
    console.log(`\n=== Record Counts ===`);
    console.log(`Users: ${userCount[0].count}`);
    console.log(`Appointments: ${appointmentCount[0].count}`);
    
    console.log('\n=== Database Initialization Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during initialization:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  init();
}

module.exports = { init };
