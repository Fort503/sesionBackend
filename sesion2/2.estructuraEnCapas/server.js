require('dotenv').config();

const express = require("express");
const rutaTareas = require("./routes/tarea.routes.js");
const { sequelizeInstance } = require("./database/db.js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/tareas", rutaTareas);

sequelizeInstance
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.error("Error al conectar DB:", error));