const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);

// Owner specific flows (temp password verification and set new password)
router.post('/owner/verify-temp', authController.verifyOwnerTemp);
router.post('/owner/set-password', authController.setOwnerPassword);
router.post('/owner/forgot-password/request-otp', authController.ownerForgotPasswordRequestOTP);
router.post('/owner/forgot-password/verify-otp', authController.ownerForgotPasswordVerifyOTP);
router.post('/owner/forgot-password/reset-password', authController.ownerForgotPasswordReset);

// Tenant specific flows (temp password verification and set new password)
router.post('/tenant/verify-temp', authController.verifyTenantTemp);
router.post('/tenant/set-password', authController.setTenantPassword);
router.post('/tenant/forgot-password/request-otp', authController.tenantForgotPasswordRequestOTP);
router.post('/tenant/forgot-password/verify-otp', authController.tenantForgotPasswordVerifyOTP);
router.post('/tenant/forgot-password/reset-password', authController.tenantForgotPasswordReset);

// Forgot Password Flow
router.post('/forgot-password/request-otp', authController.forgotPasswordRequestOTP);
router.post('/forgot-password/verify-otp', authController.forgotPasswordVerifyOTP);
router.post('/forgot-password/reset-password', authController.forgotPasswordReset);

module.exports = router;
