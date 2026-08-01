const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  res.status(status).json({ message });
};

export default errorHandler;
