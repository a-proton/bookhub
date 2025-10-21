import serverless from "serverless-http";
import app from "./server.js";

// Export the serverless handler
export default serverless(app);
