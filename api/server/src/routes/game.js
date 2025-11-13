"use strict";
/**
 * Game Routes
 * Guardian Grove Server
 */
exports.__esModule = true;
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var gameController_1 = require("../controllers/gameController");
var router = (0, express_1.Router)();
// All game routes require authentication
router.use(auth_1.authenticateToken);
// Initialize new game
router.post('/initialize', gameController_1.initializeGame);
// Game save
router.get('/save', gameController_1.getGameSave);
router.put('/save', gameController_1.updateGameSave);
exports["default"] = router;
