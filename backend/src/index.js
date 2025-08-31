/**
 * backend/src/index.js
 * Purpose: Express entrypoint - sets routes and middleware.
 */
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const herbsRouter = require("./routes/herbs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (req, res) => res.status(200).send("ok"));

app.use("/api/herbs", herbsRouter);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/herbs";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Backend listening on ${port}`));
  })
  .catch((err) => { console.error("Mongo connection error:", err); process.exit(1); });
