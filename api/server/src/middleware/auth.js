"use strict";
/**
 * Authentication Middleware
 * Guardian Grove Server
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.generateToken = exports.authenticateToken = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
function authenticateToken(req, res, next) {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }
    try {
        var decoded = jsonwebtoken_1["default"].verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            displayName: decoded.displayName
        };
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}
exports.authenticateToken = authenticateToken;
function generateToken(user) {
    return jsonwebtoken_1["default"].sign({
        id: user.id,
        email: user.email,
        displayName: user.displayName
    }, JWT_SECRET, { expiresIn: '7d' });
}
exports.generateToken = generateToken;
