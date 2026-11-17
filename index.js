const express = require('express');
const app = express();
const path = require('path');
const { randomUUID } = require('node:crypto');
const port = process.env.PORT || 3000;
const customResponses = new Map();
const maxCustomResponses = 100;
let latestWebhookEvent = null;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/docs", (req, res) => {
  res.render("docs");
});

app.get("/tools", (req, res) => {
  res.render("tools");
});

app.post("/api/custom-responses", (req, res) => {
  if (req.body === null || typeof req.body !== "object") {
    return res.status(400).json({ error: "The response body must be a JSON object or array." });
  }

  if (customResponses.size >= maxCustomResponses) {
    return res.status(429).json({ error: "The temporary custom response limit has been reached." });
  }

  const id = randomUUID();
  customResponses.set(id, req.body);
  return res.status(201).json({ path: `/api/custom-responses/${id}` });
});

app.get("/api/custom-responses/:id", (req, res) => {
  if (!customResponses.has(req.params.id)) {
    return res.status(404).json({ error: "Custom response not found. Generated responses reset when the server restarts." });
  }

  return res.json(customResponses.get(req.params.id));
});

app.post("/api/webhooks/test", (req, res) => {
  if (req.body === null || typeof req.body !== "object") {
    return res.status(400).json({ error: "The webhook body must be a JSON object or array." });
  }

  latestWebhookEvent = {
    receivedAt: new Date().toISOString(),
    event: req.body
  };

  return res.status(202).json({ status: "received", ...latestWebhookEvent });
});

app.get("/api/webhooks/test/latest", (req, res) => {
  if (!latestWebhookEvent) {
    return res.status(404).json({ error: "No webhook events have been received yet." });
  }

  return res.json(latestWebhookEvent);
});

app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "JSON response body must be 10 KB or smaller." });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Request body must contain valid JSON." });
  }

  return next(error);
});

app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
});