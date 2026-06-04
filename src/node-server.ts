import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./index";

app.use("/assets/*", serveStatic({ root: "./public" }));
app.use("/favicon.svg", serveStatic({ root: "./public" }));

serve({ fetch: app.fetch, port: 5173 }, (info) => {
  console.log(`Dev server: http://localhost:${info.port}`);
});
