import 'dotenv/config';
import app from './app.js';

// Define the port for the server to listen on.
// It will try to use the PORT from the .env file,
// or default to 5000 if it's not defined.
const PORT = process.env.PORT || 5001;

// Start the server and listen for incoming connections on the specified port.
app.listen(PORT, () => {
  // A confirmation message logged to the console once the server is running.
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}`);
});