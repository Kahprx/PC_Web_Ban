require('dotenv').config();
const app = require('./app');
const { query } = require('./utils/db');

const PORT = Number(process.env.PORT || 4000);

const start = async () => {
  try {
    await query('SELECT 1');
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Cannot start server:', error.message);
    process.exit(1);
  }
};

start();
