import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

export default db;