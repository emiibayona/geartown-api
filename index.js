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
app.get("/test", (req, res) => res.send("API Working!"));
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
