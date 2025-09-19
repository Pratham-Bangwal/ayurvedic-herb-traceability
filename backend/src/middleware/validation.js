// backend/src/middleware/validation.js
const { z } = require('zod');

// Schemas
const createHerbSchema = z.object({
  batchId: z.string().min(1, 'batchId required'),
  name: z.string().min(1, 'name required'),
  farmerName: z.string().optional(),
});

const uploadHerbSchema = z.object({
  batchId: z.string().min(1, 'batchId required'),
  name: z.string().min(1, 'name required'),
  lat: z
    .string()
    .optional()
    .refine((v) => (v === undefined ? true : !isNaN(parseFloat(v))), 'lat must be number')
    .refine((v) => (v === undefined ? true : Math.abs(parseFloat(v)) <= 90), 'lat out of range'),
  lng: z
    .string()
    .optional()
    .refine((v) => (v === undefined ? true : !isNaN(parseFloat(v))), 'lng must be number')
    .refine((v) => (v === undefined ? true : Math.abs(parseFloat(v)) <= 180), 'lng out of range'),
});

const processingEventSchema = z.object({
  actor: z.string().min(1, 'actor required'),
  data: z.string().min(1, 'data required'),
});

const transferSchema = z.object({
  newOwner: z
    .string()
    .min(1, 'newOwner required')
    .regex(/^0x[a-fA-F0-9]+$/, 'hex address required'),
});

function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: { message: error.errors[0]?.message || 'Validation failed' } });
    }
  };
}

module.exports = {
  createHerbSchema,
  uploadHerbSchema,
  processingEventSchema,
  transferSchema,
  validate,
};
