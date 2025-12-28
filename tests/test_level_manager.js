import { LevelManager } from '../src/logic/LevelManager.js';
import assert from 'assert';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();

global.localStorage = localStorageMock;

console.log("Running LevelManager tests...");

const manager = new LevelManager();

// Test 1: Default Level
const levels = manager.getLevels();
assert.ok(levels['Default Level']);
console.log("Test 1 Passed: Default Level exists");

// Test 2: Save Level
const newLevel = `
#####
#   #
#####
`;
manager.saveLevel('Test Level', newLevel);
const levels2 = manager.getLevels();
assert.strictEqual(levels2['Test Level'], newLevel);
console.log("Test 2 Passed: Save Level");

// Test 3: Get Level
const retrieved = manager.getLevel('Test Level');
assert.strictEqual(retrieved, newLevel);
console.log("Test 3 Passed: Get Level");

// Test 4: Delete Level
manager.deleteLevel('Test Level');
const levels3 = manager.getLevels();
assert.strictEqual(levels3['Test Level'], undefined);
console.log("Test 4 Passed: Delete Level");

console.log("All LevelManager tests passed!");
