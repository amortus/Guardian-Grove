"use strict";
/**
 * Authentication Controller
 * Guardian Grove Server
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.googleCallback = exports.getMe = exports.login = exports.register = void 0;
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var connection_1 = require("../db/connection");
var auth_1 = require("../middleware/auth");
/**
 * Register new user with email/password
 */
function register(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, email, password, displayName, existingUser, passwordHash, result, user, token, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    _a = req.body, email = _a.email, password = _a.password, displayName = _a.displayName;
                    // Validation
                    if (!email || !password || !displayName) {
                        return [2 /*return*/, res.status(400).json({
                                success: false,
                                error: 'Email, password, and display name are required'
                            })];
                    }
                    if (password.length < 6) {
                        return [2 /*return*/, res.status(400).json({
                                success: false,
                                error: 'Password must be at least 6 characters'
                            })];
                    }
                    return [4 /*yield*/, (0, connection_1.query)('SELECT id FROM users WHERE email = $1', [email])];
                case 1:
                    existingUser = _b.sent();
                    if (existingUser.rows.length > 0) {
                        return [2 /*return*/, res.status(409).json({
                                success: false,
                                error: 'User with this email already exists'
                            })];
                    }
                    return [4 /*yield*/, bcryptjs_1["default"].hash(password, 10)];
                case 2:
                    passwordHash = _b.sent();
                    return [4 /*yield*/, (0, connection_1.query)("INSERT INTO users (email, password_hash, display_name)\n       VALUES ($1, $2, $3)\n       RETURNING id, email, display_name, created_at, updated_at", [email, passwordHash, displayName])];
                case 3:
                    result = _b.sent();
                    user = {
                        id: result.rows[0].id,
                        email: result.rows[0].email,
                        displayName: result.rows[0].display_name,
                        createdAt: result.rows[0].created_at,
                        updatedAt: result.rows[0].updated_at
                    };
                    token = (0, auth_1.generateToken)({
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName
                    });
                    console.log("[Auth] User registered: ".concat(user.email));
                    return [2 /*return*/, res.status(201).json({
                            success: true,
                            data: { token: token, user: user }
                        })];
                case 4:
                    error_1 = _b.sent();
                    console.error('[Auth] Registration error:', error_1);
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            error: 'Failed to register user'
                        })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.register = register;
/**
 * Login with email/password
 */
function login(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, email, password, result, userRow, isValidPassword, user, token, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    _a = req.body, email = _a.email, password = _a.password;
                    // Validation
                    if (!email || !password) {
                        return [2 /*return*/, res.status(400).json({
                                success: false,
                                error: 'Email and password are required'
                            })];
                    }
                    return [4 /*yield*/, (0, connection_1.query)("SELECT id, email, password_hash, display_name, created_at, updated_at\n       FROM users\n       WHERE email = $1", [email])];
                case 1:
                    result = _b.sent();
                    if (result.rows.length === 0) {
                        return [2 /*return*/, res.status(401).json({
                                success: false,
                                error: 'Invalid email or password'
                            })];
                    }
                    userRow = result.rows[0];
                    return [4 /*yield*/, bcryptjs_1["default"].compare(password, userRow.password_hash)];
                case 2:
                    isValidPassword = _b.sent();
                    if (!isValidPassword) {
                        return [2 /*return*/, res.status(401).json({
                                success: false,
                                error: 'Invalid email or password'
                            })];
                    }
                    user = {
                        id: userRow.id,
                        email: userRow.email,
                        displayName: userRow.display_name,
                        createdAt: userRow.created_at,
                        updatedAt: userRow.updated_at
                    };
                    token = (0, auth_1.generateToken)({
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName
                    });
                    console.log("[Auth] User logged in: ".concat(user.email));
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            data: { token: token, user: user }
                        })];
                case 3:
                    error_2 = _b.sent();
                    console.error('[Auth] Login error:', error_2);
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            error: 'Failed to login'
                        })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.login = login;
/**
 * Get current user from token
 */
function getMe(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var userId, result, user, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({
                                success: false,
                                error: 'Not authenticated'
                            })];
                    }
                    return [4 /*yield*/, (0, connection_1.query)("SELECT id, email, display_name, google_id, created_at, updated_at\n       FROM users\n       WHERE id = $1", [userId])];
                case 1:
                    result = _b.sent();
                    if (result.rows.length === 0) {
                        return [2 /*return*/, res.status(404).json({
                                success: false,
                                error: 'User not found'
                            })];
                    }
                    user = {
                        id: result.rows[0].id,
                        email: result.rows[0].email,
                        displayName: result.rows[0].display_name,
                        googleId: result.rows[0].google_id,
                        createdAt: result.rows[0].created_at,
                        updatedAt: result.rows[0].updated_at
                    };
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            data: user
                        })];
                case 2:
                    error_3 = _b.sent();
                    console.error('[Auth] Get me error:', error_3);
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            error: 'Failed to get user'
                        })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getMe = getMe;
/**
 * Google OAuth callback
 */
function googleCallback(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var user, userObj, token;
        return __generator(this, function (_a) {
            try {
                user = req.user;
                if (!user) {
                    return [2 /*return*/, res.redirect("".concat(process.env.FRONTEND_URL, "/login?error=auth_failed"))];
                }
                userObj = {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                    googleId: user.google_id,
                    createdAt: user.created_at || new Date(),
                    updatedAt: user.updated_at || new Date()
                };
                token = (0, auth_1.generateToken)({
                    id: userObj.id,
                    email: userObj.email,
                    displayName: userObj.displayName
                });
                console.log("[Auth] Google OAuth success: ".concat(userObj.email));
                // Redirect to frontend with token
                return [2 /*return*/, res.redirect("".concat(process.env.FRONTEND_URL, "/auth/callback?token=").concat(token))];
            }
            catch (error) {
                console.error('[Auth] Google callback error:', error);
                return [2 /*return*/, res.redirect("".concat(process.env.FRONTEND_URL, "/login?error=server_error"))];
            }
            return [2 /*return*/];
        });
    });
}
exports.googleCallback = googleCallback;
