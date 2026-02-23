require("dotenv").config();
const express = require("express");
const routes = require("./routes"); // Automatically looks for routes/index.js
const cors = require("cors"); // Import the cors middleware

const app = express();
app.use(express.json());

// 2. Configure CORS
const corsOptions = {
  origin: process.env.CORS_ALLOW, // Allow only your frontend
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Enable this if you eventually use cookies/sessions
};

app.use(cors(corsOptions));

app.use("/api", routes);

// Health check endpoint with basic text response
app.get("/test", (req, res) => res.send("API Working!"));

// Health/Status page with Speed Insights
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Geartown API - Status</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .status {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 30px;
    }
    .info {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .info h2 {
      color: #374151;
      font-size: 1.2em;
      margin-bottom: 15px;
    }
    .endpoint {
      background: white;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      border-left: 3px solid #667eea;
    }
    .endpoint code {
      color: #667eea;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
      margin-top: 20px;
    }
    a {
      color: #667eea;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Geartown API</h1>
    <span class="status">✓ Operational</span>
    
    <div class="info">
      <h2>Available Endpoints</h2>
      <div class="endpoint">
        <code>GET /api/*</code> - API Routes
      </div>
      <div class="endpoint">
        <code>GET /test</code> - Health Check
      </div>
      <div class="endpoint">
        <code>GET /</code> - This Page
      </div>
    </div>
    
    <div class="info">
      <h2>About</h2>
      <p>This is the Geartown API backend service. The API provides various endpoints for managing products, orders, collections, and more.</p>
    </div>
    
    <div class="footer">
      <p>Deployed on <a href="https://vercel.com" target="_blank">Vercel</a> with Speed Insights enabled</p>
    </div>
  </div>
  
  <!-- Vercel Speed Insights -->
  <script>
    window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
  </script>
  <script defer src="/_vercel/speed-insights/script.js"></script>
</body>
</html>
  `);
});
if (process.env.NODE_ENV !== "production") {
  const { sequelize } = require("./database");
  sequelize.sync().then(() => {
    app.listen(process.env.PORT, () =>
      console.log(
        `Server running on http://${process.env.HOST}:${process.env.PORT}`,
      ),
    );
  });
} else {
  const { sequelize } = require("./database");
}

module.exports = app;
