require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const createIO = require('./socket');

const PORT = process.env.PORT || 5001;

(async () => {
  await connectDB(process.env.MONGO_URI);

  const server = http.createServer(app);
  createIO(server, process.env.FRONTEND_ORIGIN);

  server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
})();
