import { GameState } from '../src/logic/GameState.js';
import assert from 'assert';

console.log("Running GameState tests...");

// Test 1: Parsing
const level1 = `
#####
#@$.#
#####
`;
const state1 = GameState.fromString(level1);
assert.strictEqual(state1.width, 5);
assert.strictEqual(state1.height, 3);
assert.strictEqual(state1.player.x, 1);
assert.strictEqual(state1.player.y, 1);
assert.strictEqual(state1.boxes.length, 1);
assert.strictEqual(state1.boxes[0].x, 2);
assert.strictEqual(state1.boxes[0].y, 1);
console.log("Test 1 Passed: Parsing");

// Test 2: Available Moves (Right is blocked by box+wall? No, box is at 2,1. Wall at 4,1. Target at 3,1.
// #@$.#
// @(1,1), Box(2,1), Target(3,1), Wall(4,1).
// Move R: Player -> 2,1. Box -> 3,1. Valid? Yes.
// Move L: Wall at 0,1. Invalid.
// Move U: Wall at 1,0. Invalid.
// Move D: Wall at 1,2. Invalid.
const moves1 = state1.getAvailableMoves();
assert.deepStrictEqual(moves1, ['R']);
console.log("Test 2 Passed: Available Moves");

// Test 3: Apply Move (Push Box)
const state2 = state1.applyMove('R');
assert.strictEqual(state2.player.x, 2);
assert.strictEqual(state2.player.y, 1);
assert.strictEqual(state2.boxes[0].x, 3);
assert.strictEqual(state2.boxes[0].y, 1);
// Check Immutability
assert.strictEqual(state1.player.x, 1);
assert.strictEqual(state1.boxes[0].x, 2);
console.log("Test 3 Passed: Apply Move & Immutability");

// Test 4: Solved State
assert.strictEqual(state1.isSolved(), false);
assert.strictEqual(state2.isSolved(), true);
console.log("Test 4 Passed: Solved State");

// Test 5: Blocked Push
// #####
// #@$#
// #####
const level2 = `
#####
#@$ #
#####
`;
// Wait, the level above has a wall at 4,1. Box at 2,1. Space at 3,1.
// Let's make a blocked one.
const levelBlocked = `
#####
#@$##
#####
`;
const stateBlocked = GameState.fromString(levelBlocked);
// Box at 2,1. Wall at 3,1. Cannot push Right.
const movesBlocked = stateBlocked.getAvailableMoves();
assert.strictEqual(movesBlocked.includes('R'), false);
console.log("Test 5 Passed: Blocked Push");

console.log("All tests passed!");
