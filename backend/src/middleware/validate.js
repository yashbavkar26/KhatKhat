const { body, param, validationResult } = require('express-validator');

const phoneValidator = /^\+91[6-9]\d{9}$/;
const otpValidator = /^\d{4}$/;

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    error: errors.array()[0].msg,
  });
}

const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('role').isIn(['sender', 'carrier', 'both']),
  body('fcmToken').optional().isString(),
  handleValidationErrors,
];

const validateParcelDescription = [
  body('description').isString().isLength({ min: 10, max: 500 }),
  handleValidationErrors,
];

const validatePhone = [
  body('receiverPhone').optional().matches(phoneValidator),
  body('phone').optional().matches(phoneValidator),
  handleValidationErrors,
];

const validateOtp = [
  body('otp').matches(otpValidator),
  handleValidationErrors,
];

const validateParcelIdParam = [
  param('parcelId').isString().notEmpty(),
  handleValidationErrors,
];

const validateUserIdParam = [
  param('userId').isString().notEmpty(),
  handleValidationErrors,
];

const validateLocation = [
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  handleValidationErrors,
];

const validateEstimate = [
  body('pickupLat').isFloat({ min: -90, max: 90 }),
  body('pickupLng').isFloat({ min: -180, max: 180 }),
  body('dropLat').isFloat({ min: -90, max: 90 }),
  body('dropLng').isFloat({ min: -180, max: 180 }),
  body('urgency').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  body('itemCategory').isIn(['document', 'medicine', 'electronics', 'food', 'clothing', 'keys', 'other']),
  body('specialHandling').optional({ nullable: true }).isString(),
  handleValidationErrors,
];

module.exports = {
  phoneValidator,
  otpValidator,
  validateRegister,
  validateParcelDescription,
  validatePhone,
  validateOtp,
  validateParcelIdParam,
  validateUserIdParam,
  validateLocation,
  validateEstimate,
  handleValidationErrors,
};