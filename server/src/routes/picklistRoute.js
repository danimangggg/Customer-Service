const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadPicklist, retrievePicklists, deletePdf } = require('../controllers/picklistController');

// 🧱 Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../resources/static/assets/picklists'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ✅ Routes
router.post('/uploadPicklist', upload.single('attachment'), uploadPicklist);
router.get('/getPicklists', retrievePicklists);
router.put('/completePicklist/:id', deletePdf);

module.exports = router;
