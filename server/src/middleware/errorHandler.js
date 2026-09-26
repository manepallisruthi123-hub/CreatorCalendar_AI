function errorHandler(err, req, res, next) {
  console.error('Unhandled server error:', err);

  // Zod validation error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors ? err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) : err.message
    });
  }

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A resource with this identifier already exists'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
}

module.exports = {
  errorHandler
};
