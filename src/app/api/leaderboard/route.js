import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Armaan@016",
  database: "lextrail",
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { username, score } = req.body;
    if (!username || typeof score !== "number") return res.status(400).end();
    await db.query("INSERT INTO leaderboard (username, score) VALUES (?, ?)", [username, score]);
    return res.status(201).end();
  }
  if (req.method === "GET") {
    const [rows] = await db.query("SELECT username, score FROM leaderboard ORDER BY score DESC LIMIT 10");
    return res.status(200).json(rows);
  }
  res.status(405).end();
}