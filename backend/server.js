require('dotenv').config();

const app = require('./app');
const { query } = require('./utils/db');

const PORT = Number(process.env.PORT || 4000);

const startServer = async () => {
  try {
    await query('SELECT 1');
    app.listen(PORT, () => {
      console.log(`PC Store backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Cannot start server. PostgreSQL connection failed.', error.message);
    process.exit(1);
  }
};

startServer();
