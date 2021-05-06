const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const port = process.env.PORT || 80;
const sslPort = 443;
const centerRoute = require("./routes/centerRoute");
const locationRoute = require("./routes/locationRoute");

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

app.use("/center", centerRoute);
app.use("/location", locationRoute);

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });

  return;
});

// const sslServer = https.createServer(
//   {
//     key: fs.readFileSync(path.join(__dirname, "cert", "private.pem")),
//     cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem")),
//   },
//   app
// );

// sslServer.listen(sslPort, "0.0.0.0", () =>
//   console.log(`Server listening at https://localhost:${sslPort}`)
// );

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
