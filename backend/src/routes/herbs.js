const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Herb = require("../models/herbModel");
const bc = require("../services/blockchainService");
const qrcode = require("qrcode");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

bc.init();

// ✅ Create batch (supports JSON or multipart)
router.post("/create", upload.single("image"), async (req, res) => {
  try {
    // Works whether request is JSON or multipart
    const { batchId, farmerName, lat, lng, metadataURI } = req.body;
    if (!batchId) return res.status(400).json({ error: "batchId required" });

    const imagePath = req.file ? path.relative(process.cwd(), req.file.path) : "";

    const herb = new Herb({
      batchId,
      farmerName,
      geo: { type: "Point", coordinates: [parseFloat(lng || 0), parseFloat(lat || 0)] },
      metadataURI: metadataURI || "",
      imagePath
    });
    await herb.save();

    try {
      await bc.createBatchOnChain(batchId, "0x0000000000000000000000000000000000000000", metadataURI || "");
    } catch (err) {
      console.error("⚠️ Blockchain error:", err.message);
      // Don't kill request, just mark chain call as failed
    }


    const traceUrl = `${req.protocol}://${req.get("host")}/api/herbs/trace/${encodeURIComponent(batchId)}`;
    const qrDataURL = await qrcode.toDataURL(traceUrl);

    return res.json({ herb, qr: qrDataURL, traceUrl });
  } catch (err) {
    console.error("❌ /create error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/update", express.json(), async (req, res) => {
  try {
    const { batchId, actor, data } = req.body;
    if (!batchId) return res.status(400).json({ error: "batchId required" });
    const herb = await Herb.findOne({ batchId });
    if (!herb) return res.status(404).json({ error: "batch not found" });

    herb.processingEvents.push({ actor, data });
    await herb.save();

    try {
      await bc.addEventOnChain(batchId, actor, data);
    } catch (err) {
      console.error("⚠️ Blockchain error (update):", err.message);
    }
    return res.json({ herb });
  } catch (err) {
    console.error("❌ /update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/trace/:batchId", async (req, res) => {
  try {
    const batchId = req.params.batchId;
    const herb = await Herb.findOne({ batchId }).lean();
    if (!herb) return res.status(404).json({ error: "batch not found" });

    return res.json({
      herb,
      chain: { mock: !process.env.HERB_REGISTRY_ADDRESS, notes: "Chain integration active if HERB_REGISTRY_ADDRESS set" }
    });
  } catch (err) {
    console.error("❌ /trace error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
