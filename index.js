const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/docs", (req, res) => {
  res.render("docs");
});

app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
});