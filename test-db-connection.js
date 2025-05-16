const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.psauufynrjxuonwdmnyo:pimgar-muqgax-9jUfga@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Database connected successfully!');
    await client.end();
  } catch (error) {
    // Log full error details
    console.error('Failed to connect to the database:', error);
  }
}

testConnection();
