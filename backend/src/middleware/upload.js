const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * File filter — only allow JPEG, PNG, PDF.
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and PDF are allowed.'), false);
  }
};

/**
 * Determine storage engine.
 * If AWS credentials are set, use S3; otherwise fall back to local disk.
 */
const createStorage = () => {
  const useS3 =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET;

  if (useS3) {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    return multerS3({
      s3: s3Client,
      bucket: process.env.S3_BUCKET,
      acl: 'private',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `receipts/${req.user?.id || 'unknown'}/${uniqueSuffix}${ext}`);
      },
    });
  }

  // Local disk storage fallback
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `receipt-${uniqueSuffix}${ext}`);
    },
  });
};

const upload = multer({
  storage: createStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Build a publicly accessible URL for an uploaded file.
 * For S3 files, req.file.location is set by multer-s3.
 * For local files, construct from the server's base URL.
 */
const getFileUrl = (req) => {
  if (!req.file) return null;

  // S3 upload sets location
  if (req.file.location) return req.file.location;

  // Local file
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${req.file.filename}`;
};

module.exports = { upload, getFileUrl };
