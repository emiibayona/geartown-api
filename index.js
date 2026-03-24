require("dotenv").config();
const express = require("express");
const routes = require("./routes"); // Automatically looks for routes/index.js
const cors = require("cors"); // Import the cors middleware

const app = express();
app.use(express.json());

// 2. Configure CORS
const rawOrigins = process.env.CORS_ALLOW || '';
const allowedOrigins = rawOrigins.split(',').map(origin => origin.trim());

const corsOptions = {
  origin: function (origin, callback) {
    // 1. Permitir peticiones sin origen (como Postman o Server-to-Server)
    if (!origin) return callback(null, true);

    // 2. Verificar si el origen está en nuestra lista blanca
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log de seguridad para que sepas quién intentó entrar
      console.error(`⚠️ Acceso denegado por CORS para el origen: ${origin}`);
      callback(new Error('No permitido por la política de seguridad de Geartown'));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Enable this if you eventually use cookies/sessions
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use("/api", routes);
app.get("/test", (req, res) => res.send("API Working!"));
const { sequelize } = require("./database");
if (process.env.NODE_ENV !== "production") {
  app.listen(process.env.PORT, () =>
    console.log(
      `Server running on http://${process.env.HOST}:${process.env.PORT}`,
    ),
  );

}

module.exports = app;
