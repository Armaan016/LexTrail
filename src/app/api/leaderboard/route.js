import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD || "",
  database: "lextrail",
});

async function testConnection() {
  try {
    await db.query("SELECT 1");
    console.log("✅ MySQL connection successful");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err);
  }
}

export async function POST(request) {
  await testConnection();
  const { username, score } = await request.json();
  if (!username || typeof score !== "number") {
    return new Response("Invalid input", { status: 400 });
  }
  await db.query("INSERT INTO leaderboard (username, score) VALUES (?, ?)", [username, score]);
  return new Response(null, { status: 201 });
}

export async function GET() {
  await testConnection();
  const [rows] = await db.query("SELECT username, score FROM leaderboard ORDER BY score DESC LIMIT 10");
  return Response.json(rows, { status: 200 });
}