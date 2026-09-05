import db from "./database.js";

// npx tsx setup.ts

// markers TEXT NOT NULL

db.run(`
  CREATE TABLE IF NOT EXISTS worlds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tiles TEXT NOT NULL
  )
`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("World table ready");
    }
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
