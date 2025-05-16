const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://toss_user:bQhs0ZjKsSEovj4PUi6tX7LaVvaoQub9@dpg-d0jlnfd6ubrc73ajjmq0-a.oregon-postgres.render.com/toss',
  ssl: {
    rejectUnauthorized: false // Required for Render's self-signed certificate
  }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Database connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time:', res.rows[0].now);
    await client.end();
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
  }
}

testConnection();