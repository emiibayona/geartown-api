const express = require("express");
const { sequelize } = require("./database");
const routes = require("./routes"); // Automatically looks for routes/index.js
const cors = require("cors"); // Import the cors middleware

const app = express();
app.use(express.json());

// 2. Configure CORS
const corsOptions = {
  origin: "*", // Allow only your frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Enable this if you eventually use cookies/sessions
};

app.use(cors(corsOptions));

app.use("/api", routes);

// Start Server
const PORT = 8081;
sequelize.sync().then(() => {
  app.listen(PORT, () =>
    console.log(`API running on http://localhost:${PORT}`),
  );
});
