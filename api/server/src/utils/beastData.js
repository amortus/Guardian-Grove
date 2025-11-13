"use strict";
/**
 * Beast Data Utility
 * Provides base stats and techniques for each beast line
 */
exports.__esModule = true;
exports.generateRandomBeast = exports.getBeastLineData = void 0;
function getBeastLineData(line) {
    var baseData = {
        olgrim: {
            name: 'Olgrim',
            attributes: { might: 15, wit: 30, focus: 25, agility: 18, ward: 12, vitality: 18 },
            maxHp: 90,
            techniques: ['mystic_blast', 'mind_spike', 'ethereal_shield']
        },
        terravox: {
            name: 'Terravox',
            attributes: { might: 28, wit: 12, focus: 18, agility: 10, ward: 35, vitality: 32 },
            maxHp: 160,
            techniques: ['stone_slam', 'earth_wall', 'tremor']
        },
        feralis: {
            name: 'Feralis',
            attributes: { might: 25, wit: 18, focus: 25, agility: 30, ward: 18, vitality: 22 },
            maxHp: 110,
            techniques: ['swift_strike', 'shadow_claw', 'agile_dodge']
        },
        brontis: {
            name: 'Brontis',
            attributes: { might: 28, wit: 18, focus: 20, agility: 18, ward: 25, vitality: 28 },
            maxHp: 140,
            techniques: ['power_crush', 'tail_whip', 'stomp']
        },
        zephyra: {
            name: 'Zephyra',
            attributes: { might: 18, wit: 25, focus: 25, agility: 35, ward: 15, vitality: 18 },
            maxHp: 90,
            techniques: ['wind_slash', 'aerial_dive', 'gust']
        },
        ignar: {
            name: 'Ignar',
            attributes: { might: 35, wit: 20, focus: 20, agility: 22, ward: 20, vitality: 24 },
            maxHp: 120,
            techniques: ['flame_burst', 'inferno', 'fire_tackle']
        },
        mirella: {
            name: 'Mirella',
            attributes: { might: 22, wit: 24, focus: 24, agility: 22, ward: 22, vitality: 24 },
            maxHp: 120,
            techniques: ['water_pulse', 'aqua_shield', 'tide_surge']
        },
        umbrix: {
            name: 'Umbrix',
            attributes: { might: 20, wit: 28, focus: 24, agility: 25, ward: 18, vitality: 22 },
            maxHp: 110,
            techniques: ['shadow_strike', 'dark_veil', 'nightmare']
        },
        sylphid: {
            name: 'Sylphid',
            attributes: { might: 12, wit: 35, focus: 30, agility: 25, ward: 15, vitality: 18 },
            maxHp: 90,
            techniques: ['spirit_bolt', 'ethereal_form', 'mystic_ray']
        },
        raukor: {
            name: 'Raukor',
            attributes: { might: 28, wit: 18, focus: 25, agility: 26, ward: 22, vitality: 25 },
            maxHp: 125,
            techniques: ['feral_bite', 'pack_tactics', 'howl']
        }
    };
    return baseData[line] || baseData.feralis; // Default to feralis if unknown
}
exports.getBeastLineData = getBeastLineData;
/**
 * Generate a completely random and unique Beast for a new player
 * Each Beast will have randomized stats and traits
 */
function generateRandomBeast(playerName) {
    // All 10 Beast lines
    var beastLines = ['olgrim', 'terravox', 'feralis', 'brontis', 'zephyra', 'ignar', 'mirella', 'umbrix', 'sylphid', 'raukor'];
    // Pick random line
    var randomIndex = Math.floor(Math.random() * beastLines.length);
    var randomLine = beastLines[randomIndex];
    console.log("[BeastGen] Random index: ".concat(randomIndex, ", Selected line: ").concat(randomLine));
    var lineData = getBeastLineData(randomLine);
    // Elemental affinities
    var affinities = ['earth', 'fire', 'water', 'air', 'shadow', 'ether', 'light', 'moon', 'blood'];
    var randomAffinity = affinities[Math.floor(Math.random() * affinities.length)];
    // Personality traits
    var traits = ['loyal', 'brave', 'patient', 'disciplined', 'curious', 'lazy', 'proud', 'anxious', 'stubborn', 'aggressive'];
    // Pick 2-3 random traits
    var numTraits = 2 + Math.floor(Math.random() * 2); // 2 or 3 traits
    var selectedTraits = [];
    while (selectedTraits.length < numTraits) {
        var trait = traits[Math.floor(Math.random() * traits.length)];
        if (!selectedTraits.includes(trait)) {
            selectedTraits.push(trait);
        }
    }
    // Blood rarity (weighted: 60% common, 30% uncommon, 9% rare, 1% legendary)
    var bloodRoll = Math.random();
    var blood;
    if (bloodRoll < 0.60)
        blood = 'common';
    else if (bloodRoll < 0.90)
        blood = 'uncommon';
    else if (bloodRoll < 0.99)
        blood = 'rare';
    else
        blood = 'legendary';
    // Random stat variation: ±20% from base stats
    var varyAttribute = function (base) {
        var variation = Math.random() * 0.4 - 0.2; // -20% to +20%
        return Math.max(5, Math.floor(base * (1 + variation)));
    };
    var randomizedAttributes = {
        might: varyAttribute(lineData.attributes.might),
        wit: varyAttribute(lineData.attributes.wit),
        focus: varyAttribute(lineData.attributes.focus),
        agility: varyAttribute(lineData.attributes.agility),
        ward: varyAttribute(lineData.attributes.ward),
        vitality: varyAttribute(lineData.attributes.vitality)
    };
    // Calculate HP based on vitality
    var maxHp = randomizedAttributes.vitality * 5;
    // Generate unique name
    var beastName = "".concat(lineData.name, " de ").concat(playerName);
    var beast = {
        id: "beast-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
        name: beastName,
        line: randomLine,
        blood: blood,
        affinity: randomAffinity,
        attributes: randomizedAttributes,
        secondaryStats: {
            fatigue: 0,
            stress: 0,
            loyalty: 50 + Math.floor(Math.random() * 30),
            age: 0,
            maxAge: 100
        },
        traits: selectedTraits,
        techniques: lineData.techniques,
        currentHp: maxHp,
        maxHp: maxHp,
        essence: 50,
        maxEssence: 99,
        level: 1,
        experience: 0,
        activeBuffs: []
    };
    console.log("[BeastGen] Generated: ".concat(beast.name, " (").concat(beast.line, ", ").concat(beast.blood, ", ").concat(beast.affinity, ")"));
    console.log("[BeastGen] Stats: might=".concat(beast.attributes.might, ", vitality=").concat(beast.attributes.vitality, ", loyalty=").concat(beast.secondaryStats.loyalty));
    console.log("[BeastGen] Traits: ".concat(beast.traits.join(', ')));
    return beast;
}
exports.generateRandomBeast = generateRandomBeast;
