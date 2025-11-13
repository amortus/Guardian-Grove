"use strict";
/**
 * Game Controller
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
exports.__esModule = true;
exports.updateGameSave = exports.getGameSave = exports.initializeGame = void 0;
var connection_1 = require("../db/connection");
var beastData_1 = require("../utils/beastData");
/**
 * Initialize new game for user
 */
function initializeGame(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var client, userId, playerName, existingSave, gameSaveResult, gameSave, randomBeast, beastResult, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, connection_1.getClient)()];
                case 1:
                    client = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 10, 12, 13]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ success: false, error: 'Not authenticated' })];
                    }
                    playerName = req.body.playerName;
                    if (!playerName || playerName.trim().length === 0) {
                        return [2 /*return*/, res.status(400).json({ success: false, error: 'Player name is required' })];
                    }
                    return [4 /*yield*/, client.query('BEGIN')];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, client.query('SELECT id FROM game_saves WHERE user_id = $1', [userId])];
                case 4:
                    existingSave = _b.sent();
                    if (!(existingSave.rows.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, client.query('ROLLBACK')];
                case 5:
                    _b.sent();
                    return [2 /*return*/, res.status(409).json({
                            success: false,
                            error: 'User already has a game save'
                        })];
                case 6: return [4 /*yield*/, client.query("INSERT INTO game_saves (user_id, player_name)\n       VALUES ($1, $2)\n       RETURNING id, user_id, player_name, week, coronas, victories, current_title, created_at, updated_at", [userId, playerName.trim()])];
                case 7:
                    gameSaveResult = _b.sent();
                    gameSave = gameSaveResult.rows[0];
                    randomBeast = (0, beastData_1.generateRandomBeast)(playerName.trim());
                    return [4 /*yield*/, client.query("INSERT INTO beasts (\n        game_save_id, name, line, blood, affinity, is_active,\n        current_hp, max_hp, essence, max_essence,\n        might, wit, focus, agility, ward, vitality,\n        loyalty, stress, fatigue, techniques, traits, level, experience\n      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)\n      RETURNING *", [
                            gameSave.id,
                            randomBeast.name,
                            randomBeast.line,
                            randomBeast.blood,
                            randomBeast.affinity,
                            true,
                            randomBeast.currentHp,
                            randomBeast.maxHp,
                            randomBeast.essence,
                            randomBeast.maxEssence,
                            randomBeast.attributes.might,
                            randomBeast.attributes.wit,
                            randomBeast.attributes.focus,
                            randomBeast.attributes.agility,
                            randomBeast.attributes.ward,
                            randomBeast.attributes.vitality,
                            randomBeast.secondaryStats.loyalty,
                            randomBeast.secondaryStats.stress,
                            randomBeast.secondaryStats.fatigue,
                            JSON.stringify(randomBeast.techniques),
                            JSON.stringify(randomBeast.traits),
                            randomBeast.level,
                            randomBeast.experience
                        ])];
                case 8:
                    beastResult = _b.sent();
                    return [4 /*yield*/, client.query('COMMIT')];
                case 9:
                    _b.sent();
                    console.log("[Game] Initialized game for user ".concat(userId, ": ").concat(playerName, " with ").concat(randomBeast.line, " (").concat(randomBeast.blood, ")"));
                    return [2 /*return*/, res.status(201).json({
                            success: true,
                            data: {
                                gameSave: {
                                    id: gameSave.id,
                                    userId: gameSave.user_id,
                                    playerName: gameSave.player_name,
                                    week: gameSave.week,
                                    coronas: gameSave.coronas,
                                    victories: gameSave.victories,
                                    currentTitle: gameSave.current_title,
                                    createdAt: gameSave.created_at,
                                    updatedAt: gameSave.updated_at
                                },
                                initialBeast: beastResult.rows[0]
                            }
                        })];
                case 10:
                    error_1 = _b.sent();
                    return [4 /*yield*/, client.query('ROLLBACK')];
                case 11:
                    _b.sent();
                    console.error('[Game] Initialize error:', error_1);
                    return [2 /*return*/, res.status(500).json({ success: false, error: 'Failed to initialize game' })];
                case 12:
                    client.release();
                    return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    });
}
exports.initializeGame = initializeGame;
/**
 * Get game save for current user
 */
function getGameSave(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var userId, saveResult, gameSave, beastsResult, inventoryResult, questsResult, achievementsResult, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ success: false, error: 'Not authenticated' })];
                    }
                    return [4 /*yield*/, (0, connection_1.query)("SELECT id, user_id, player_name, week, coronas, victories, current_title,\n              win_streak, lose_streak, total_trains, total_crafts, total_spent,\n              created_at, updated_at\n       FROM game_saves\n       WHERE user_id = $1", [userId])];
                case 1:
                    saveResult = _b.sent();
                    if (saveResult.rows.length === 0) {
                        return [2 /*return*/, res.status(404).json({ success: false, error: 'No game save found' })];
                    }
                    gameSave = saveResult.rows[0];
                    return [4 /*yield*/, (0, connection_1.query)('SELECT * FROM beasts WHERE game_save_id = $1', [gameSave.id])];
                case 2:
                    beastsResult = _b.sent();
                    return [4 /*yield*/, (0, connection_1.query)('SELECT * FROM inventory WHERE game_save_id = $1', [gameSave.id])];
                case 3:
                    inventoryResult = _b.sent();
                    return [4 /*yield*/, (0, connection_1.query)('SELECT * FROM quests WHERE game_save_id = $1', [gameSave.id])];
                case 4:
                    questsResult = _b.sent();
                    return [4 /*yield*/, (0, connection_1.query)('SELECT * FROM achievements WHERE game_save_id = $1', [gameSave.id])];
                case 5:
                    achievementsResult = _b.sent();
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            data: {
                                gameSave: gameSave,
                                beasts: beastsResult.rows,
                                inventory: inventoryResult.rows,
                                quests: questsResult.rows,
                                achievements: achievementsResult.rows
                            }
                        })];
                case 6:
                    error_2 = _b.sent();
                    console.error('[Game] Get save error:', error_2);
                    return [2 /*return*/, res.status(500).json({ success: false, error: 'Failed to get game save' })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.getGameSave = getGameSave;
/**
 * Update game save
 */
function updateGameSave(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var userId, _b, week, coronas, victories, currentTitle, winStreak, loseStreak, totalTrains, totalCrafts, totalSpent, result, error_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ success: false, error: 'Not authenticated' })];
                    }
                    _b = req.body, week = _b.week, coronas = _b.coronas, victories = _b.victories, currentTitle = _b.currentTitle, winStreak = _b.winStreak, loseStreak = _b.loseStreak, totalTrains = _b.totalTrains, totalCrafts = _b.totalCrafts, totalSpent = _b.totalSpent;
                    return [4 /*yield*/, (0, connection_1.query)("UPDATE game_saves\n       SET week = COALESCE($2, week),\n           coronas = COALESCE($3, coronas),\n           victories = COALESCE($4, victories),\n           current_title = COALESCE($5, current_title),\n           win_streak = COALESCE($6, win_streak),\n           lose_streak = COALESCE($7, lose_streak),\n           total_trains = COALESCE($8, total_trains),\n           total_crafts = COALESCE($9, total_crafts),\n           total_spent = COALESCE($10, total_spent)\n       WHERE user_id = $1\n       RETURNING *", [userId, week, coronas, victories, currentTitle, winStreak, loseStreak, totalTrains, totalCrafts, totalSpent])];
                case 1:
                    result = _c.sent();
                    if (result.rows.length === 0) {
                        return [2 /*return*/, res.status(404).json({ success: false, error: 'Game save not found' })];
                    }
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            data: result.rows[0]
                        })];
                case 2:
                    error_3 = _c.sent();
                    console.error('[Game] Update save error:', error_3);
                    return [2 /*return*/, res.status(500).json({ success: false, error: 'Failed to update game save' })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.updateGameSave = updateGameSave;
