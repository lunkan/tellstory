import db from "./database.js";

// npx tsx setup.ts

db.run(`
  CREATE TABLE IF NOT EXISTS worlds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    palette INTEGER NOT NULL,
    tiles TEXT NOT NULL
  )
`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("World table ready");
    }
});

// Migrations for databases created before these columns existed. ADD COLUMN
// needs a DEFAULT to satisfy NOT NULL on existing rows, which is where the 0 comes from.
[
    "ALTER TABLE worlds ADD COLUMN size INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE worlds ADD COLUMN palette INTEGER NOT NULL DEFAULT 0",
].forEach((statement) => {
    db.run(statement, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error(err.message);
        }
    });
});

db.run(`
  CREATE TABLE IF NOT EXISTS palettes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data TEXT NOT NULL
  )
`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Palette table ready");
    }
});

db.run(`
  CREATE TABLE IF NOT EXISTS locationProfiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    description TEXT NOT NULL,
    reminiscence TEXT NOT NULL,
    summary TEXT NOT NULL
  )
`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Location profiles table ready");
    }
});

db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL
  )
`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Settings table ready");
    }
});
