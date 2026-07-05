  Scripts:
  - npm run dev — runs server (tsx watch on :3000) and Vite dev server (:5173) concurrently
  - npm run build — type-checks then builds the frontend to dist/
  - npm start — runs the server only

  Note: the frontend now calls /chat (no host) and Vite proxies it to Express in dev. Make sure your .env with
  ANTHROPIC_API_KEY is in the project root. Type-check and Vite build both pass.


  DB setup:
  npm run db:setup


  