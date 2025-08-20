import AppError from '../utils/AppError.js';

const castErrorHandler = err => {
  return new AppError(
    `Invalid value '${err.value}' for field '${err.path}'. Expected type: ${err.kind}.`,
    400
  );
};

const schemaValidationErrorHandler = err => {
  if (!err.errors || typeof err.errors !== 'object') {
    // fallback message if err.errors is missing or not an object
    return new AppError(err.message || 'Invalid input data', 400);
  }

  const messages = Object.values(err.errors)
    .map(error => {
      // Check if properties and message exist before accessing
      if (error && error.properties && error.properties.message) {
        return error.properties.message;
      }

      // fallback string if message missing
      return `Invalid input data for ${error.path}`;
    })
    .join('; ');

  return new AppError(messages, 400);
};

const duplicateKeyErrorHandler = err => {
  return new AppError(`${Object.keys(err.keyValue)} already in use`, 409);
};

const tokenExpiredError = err => {
  return new AppError(`Session expired. please login again`, 401);
};

const jsonWebTokenError = err => {
  return new AppError('Invalid token. please login again', 401);
};

const devError = (res, err) => {
  console.log({
    status: err.status ?? 'error',
    message: err.message,
    stackTrace: err.stack,
    error: err,
  });
  res.status(err.statusCode ?? 500).json({
    status: err.status ?? 'error',
    message: err.message,
    stackTrace: err.stack,
    error: err,
  });
};

const prodError = (res, err) => {
  if (!err.isOperational) {
    res.status(500).json({
      status: 'error',
      message: 'Encountered unexpected error',
    });
  } else {
    res.status(err.statusCode ?? 500).json({
      status: err.status ?? 'error',
      message: err.message,
    });
  }
};

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    devError(res, err);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = castErrorHandler(err);
    if (err.name === 'ValidationError') err = schemaValidationErrorHandler(err);
    if (err.code === 11000) err = duplicateKeyErrorHandler(err);
    if (err.name === 'TokenExpiredError') err = tokenExpiredError(err);
    if (err.name === 'JsonWebTokenError') err = jsonWebTokenError(err);

    prodError(res, err);
  }
};

export default errorHandler;
