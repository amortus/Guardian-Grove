"use strict";
/**
 * Authentication Routes
 * Guardian Grove Server
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = require("express");
var authController_1 = require("../controllers/authController");
var auth_1 = require("../middleware/auth");
var passport_1 = __importDefault(require("../config/passport"));
var router = (0, express_1.Router)();
// Register new user
router.post('/register', authController_1.register);
// Login
router.post('/login', authController_1.login);
// Get current user (protected route)
router.get('/me', auth_1.authenticateToken, authController_1.getMe);
// Google OAuth
router.get('/google', passport_1["default"].authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));
// Google OAuth callback
router.get('/google/callback', passport_1["default"].authenticate('google', {
    session: false,
    failureRedirect: process.env.FRONTEND_URL + '/login?error=auth_failed'
}), authController_1.googleCallback);
// Logout (client-side - just remove token)
router.post('/logout', function (req, res) {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
exports["default"] = router;
