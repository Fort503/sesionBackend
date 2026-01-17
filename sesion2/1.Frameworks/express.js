import express from "express";

const app = express();

const estudiantes = [
  {
    "Nombre": "Pepe Cuenca",
    "Carrera": "Ingeniería de Sistemas"
  },
  {
    "Nombre": "Miguelito",
    "Carrera": "Ingeniería Industrial"
  }
];

app.get("/", (req, res) => {
  res.send("Hola mundo");
});

app.get("/estudiantes", (req, res) => {
  res.json(estudiantes);
});

app.listen(8000);
