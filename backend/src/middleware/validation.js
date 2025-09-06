// backend/src/middleware/validation.js
const { z } = require('zod');
const { error } = require('../utils/response');

// Schemas
const createHerbSchema = z.object({
  batchId: z.string().trim().min(1, 'batchId required'),
  name: z.string().trim().min(1, 'name required'),
  farmerName: z.string().optional(),
});

const processingEventSchema = z.object({
  actor: z.string().trim().min(1, 'actor required'),
  data: z.string().trim().min(1, 'data required'),
});

const transferSchema = z.object({
  newOwner: z
    .string()
    .trim()
    .min(1, 'newOwner required')
    .regex(/^0x[a-fA-F0-9]{3,}$/, 'newOwner must look like a hex address (0x...)'),
});

const uploadHerbSchema = z.object({
  batchId: z.string().trim().min(1, 'batchId required'),
  name: z.string().trim().min(1, 'name required'),
  lat: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), 'lat must be numeric')
    .refine((v) => !v || (parseFloat(v) >= -90 && parseFloat(v) <= 90), 'lat out of range'),
  lng: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), 'lng must be numeric')
    .refine((v) => !v || (parseFloat(v) >= -180 && parseFloat(v) <= 180), 'lng out of range'),
  harvestedAt: z.string().optional(),
});

function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req.validated = req.validated || {};
      req.validated[source] = parsed;
      next();
    } catch (e) {
      const first = e.errors?.[0];
      return error(res, 'validation_error', first?.message || 'Invalid input', 400);
    }
  };
}

module.exports = {
  createHerbSchema,
  processingEventSchema,
  transferSchema,
  uploadHerbSchema,
  validate,
};
