import db from "./database.js";

// storyteller/npx tsx setup.ts

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
