import { ZodError } from 'zod';

export const validateBody = (schema) => async (req, res, next) => {
  try {
    // Reject empty body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && (!req.body || Object.keys(req.body).length === 0)) {
      return res.status(400).json({ success: false, error: 'Empty request body' });
    }

    // Parse strictly - disallow unknown keys
    const parsed = await schema.strict().parseAsync(req.body);
    req.validatedBody = parsed;
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, error: 'Validation failed', details: issues });
    }
    return res.status(400).json({ success: false, error: err.message || 'Invalid request' });
  }
};
