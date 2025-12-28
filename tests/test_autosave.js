import { LevelManager } from '../src/logic/LevelManager.js';
import { GameState } from '../src/logic/GameState.js';
import assert from 'assert';

// Mock localStorage
const storage = {};
global.localStorage = {
    getItem: (key) => storage[key],
    setItem: (key, value) => storage[key] = value,
    removeItem: (key) => delete storage[key],
    clear: () => { for (let key in storage) delete storage[key]; }
};

console.log("Running Auto-Save tests...");

const levelManager = new LevelManager();
const levelName = "AutoSaveTest";
const initialLevel =
    `#####
#@  #
#####`;

levelManager.saveLevel(levelName, initialLevel);

// Simulate Editor State
let editorState = {
    width: 5,
    height: 3,
    grid: [
        ['#', '#', '#', '#', '#'],
        ['#', '@', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#']
    ]
};

// Simulate Auto-Save
function autoSave() {
    const levelStr = editorState.grid.map(row => row.join('')).join('\n');
    levelManager.saveLevel(levelName, levelStr);
}

// Modify Grid (Add a wall)
editorState.grid[1][2] = '#';
autoSave();

// Verify localStorage updated
const savedLevel = levelManager.getLevel(levelName);
const expectedLevel =
    `#####
#@# #
#####`;

assert.strictEqual(savedLevel.trim(), expectedLevel.trim(), "LocalStorage should be updated after auto-save");

// Verify GameState creation
const newState = GameState.fromString(savedLevel);
assert.ok(newState.walls[1][2], "New GameState should reflect the added wall");

console.log("All Auto-Save tests passed!");
