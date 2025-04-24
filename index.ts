import express, { Request, Response } from "express";
import sqlite3 from "sqlite3";
import path from "path";

const app = express();
const PORT = 3000;
const TABLE_NAME = "data";

app.use(express.json());

// Conexión a la base de datos
const db = new sqlite3.Database(
  path.join(__dirname, `../${TABLE_NAME}.db`),
  (err) => {
    if (err) console.error("Error opening database:", err.message);
    else {
      db.run(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        temperature INTEGER NOT NULL,
        rssi INTEGER NOT NULL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now' ))
      )
    `);
    }
  }
);

app.post("/store", async (req: any, res: Response): Promise<any> => {
  const { device_id, temperature, rssi } = req.body;
  console.log(`[LOGS]: ${new Date()} DATOS RECIBIDOS DEL NODO ${device_id}`);

  // if (!content) {
  //   return res.status(400).json({ error: "Content is required" });
  // }

  const query = `INSERT INTO ${TABLE_NAME} (device_id, temperature, rssi) VALUES (?, ?, ?)`;
  db.run(query, [device_id, temperature, rssi], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      obj: { DEVICE_ID: device_id, TEMPERATURE: temperature, RSSI: rssi },
    });
  });
});

app.get("/query", async (_req: Request, res: Response) => {
  console.log(`[LOGS]: ${new Date()} DEVOLVIENDO TODOS LOS DATOS`);
  db.all(`SELECT * FROM ${TABLE_NAME}`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

app.get("/query/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`[LOGS]: DEVOLVIENDO REGISTRO ${id}`);
  db.all(`SELECT * FROM ${TABLE_NAME} where id = ${id}`, [], (err, rows) => {
    if (err) {
    }
    res.status(200).json(rows);
  });
});

app.get("/", async (_req: Request, res: Response) => {
  res.json("Backend de Mini sistema distribuido");
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
