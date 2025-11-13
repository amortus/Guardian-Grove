"use strict";
/**
 * Passport Configuration for Google OAuth
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
var passport_1 = __importDefault(require("passport"));
var passport_google_oauth20_1 = require("passport-google-oauth20");
var connection_1 = require("../db/connection");
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1["default"].config();
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
var GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
// Only configure Google OAuth if credentials are provided
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport_1["default"].use(new passport_google_oauth20_1.Strategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
    }, function (accessToken, refreshToken, profile, done) { return __awaiter(void 0, void 0, void 0, function () {
        var email, googleId, displayName, result, updateResult, createResult, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 7]);
                    email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
                    googleId = profile.id;
                    displayName = profile.displayName;
                    if (!email) {
                        return [2 /*return*/, done(new Error('No email found in Google profile'))];
                    }
                    return [4 /*yield*/, (0, connection_1.query)('SELECT id, email, display_name, google_id FROM users WHERE google_id = $1', [googleId])];
                case 1:
                    result = _c.sent();
                    if (result.rows.length > 0) {
                        // User exists, return it
                        return [2 /*return*/, done(null, result.rows[0])];
                    }
                    return [4 /*yield*/, (0, connection_1.query)('SELECT id, email, display_name, google_id FROM users WHERE email = $1', [email])];
                case 2:
                    // Check if user exists by email
                    result = _c.sent();
                    if (!(result.rows.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, connection_1.query)('UPDATE users SET google_id = $1 WHERE email = $2 RETURNING id, email, display_name, google_id', [googleId, email])];
                case 3:
                    updateResult = _c.sent();
                    return [2 /*return*/, done(null, updateResult.rows[0])];
                case 4: return [4 /*yield*/, (0, connection_1.query)("INSERT INTO users (email, google_id, display_name)\n           VALUES ($1, $2, $3)\n           RETURNING id, email, display_name, google_id", [email, googleId, displayName])];
                case 5:
                    createResult = _c.sent();
                    return [2 /*return*/, done(null, createResult.rows[0])];
                case 6:
                    error_1 = _c.sent();
                    return [2 /*return*/, done(error_1)];
                case 7: return [2 /*return*/];
            }
        });
    }); }));
}
else {
    console.log('[OAuth] Google OAuth disabled - GOOGLE_CLIENT_ID not configured');
}
// Serialize user for session (not used with JWT, but required by Passport)
passport_1["default"].serializeUser(function (user, done) {
    done(null, user.id);
});
passport_1["default"].deserializeUser(function (id, done) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, connection_1.query)('SELECT id, email, display_name, google_id FROM users WHERE id = $1', [id])];
            case 1:
                result = _a.sent();
                done(null, result.rows[0]);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                done(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports["default"] = passport_1["default"];
