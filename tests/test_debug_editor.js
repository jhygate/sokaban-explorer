import { GameState } from '../src/logic/GameState.js';
import assert from 'assert';

// Mock DOM and Globals
global.document = {
    getElementById: () => ({
        addEventListener: () => { },
        value: '10'
    }),
    querySelectorAll: () => []
};
global.window = { addEventListener: () => { } };
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
};
global.alert = console.log;
global.confirm = () => true;

// Mock Canvas
global.canvas = {
    getContext: () => ({
        clearRect: () => { },
        strokeRect: () => { },
        fillText: () => { }
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    width: 400,
    height: 400,
    addEventListener: () => { }
};

// Mock Renderer
class MockRenderer {
    render(state) {
        this.lastRenderedState = state;
    }
}

// We need to load main.js, but it has side effects (init).
// We'll try to extract the logic or just copy relevant parts for testing if loading fails.
// Actually, let's just test the logic we suspect is broken by replicating it here.
// The core logic is in handlePaint and the update loop.

console.log("Debugging Editor Logic...");

// Setup State
let currentState = null;
let editorState = {
    width: 5,
    height: 5,
    grid: [
        ['#', '#', '#', '#', '#'],
        ['#', '@', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#']
    ]
};

// Helper: gameStateFromEditor
function gameStateFromEditor() {
    const width = editorState.width;
    const height = editorState.height;
    const walls = Array(height).fill(null).map(() => Array(width).fill(false));
    const targets = Array(height).fill(null).map(() => Array(width).fill(false));
    const boxes = [];
    let player = null;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const char = editorState.grid[y][x];
            switch (char) {
                case '#': walls[y][x] = true; break;
                case '.': targets[y][x] = true; break;
                case '$': boxes.push({ x, y }); break;
                case '*': boxes.push({ x, y }); targets[y][x] = true; break;
                case '@': player = { x, y }; break;
                case '+': player = { x, y }; targets[y][x] = true; break;
            }
        }
    }

    if (!player) return null;
    return new GameState(width, height, walls, targets, player, boxes);
}

// Initialize currentState
currentState = gameStateFromEditor();
assert.ok(currentState, "Initial state should be valid");

// Simulate Paint: Add a Wall
console.log("Test 1: Add Wall");
editorState.grid[2][2] = '#';
let newState = gameStateFromEditor();

// Logic from main.js:
if (newState) currentState = newState;

assert.ok(currentState.walls[2][2], "Current state should have the new wall");
console.log("Test 1 Passed");

// Simulate Paint: Remove Player (Invalid State)
console.log("Test 2: Remove Player");
editorState.grid[1][1] = ' '; // Overwrite player
newState = gameStateFromEditor();

// Logic from main.js:
if (newState) {
    currentState = newState;
} else {
    console.log("newState is null (expected)");
}

// Current state should NOT have changed (it still has the player)
assert.ok(currentState.player, "Current state should still have player");
assert.strictEqual(currentState.walls[2][2], true, "Current state should still have the wall from Test 1");

// BUT editorState DOES NOT have the player.
assert.strictEqual(editorState.grid[1][1], ' ', "Editor state should have no player");

// If we render currentState now, we see the player.
// If we render editorState, we see no player.
// The bug is that main.js renders currentState if it exists.

console.log("Test 2 Analysis: currentState preserved (Visual Revert Bug confirmed)");

// Simulate Resize
console.log("Test 3: Resize");
// Reset
editorState.grid[1][1] = '@';
currentState = gameStateFromEditor();

const newW = 6;
const newH = 6;
// Resize logic
const oldGrid = editorState.grid;
const newGrid = Array(newH).fill(null).map(() => Array(newW).fill(' '));
for (let y = 0; y < Math.min(editorState.height, newH); y++) {
    for (let x = 0; x < Math.min(editorState.width, newW); x++) {
        newGrid[y][x] = oldGrid[y][x];
    }
}
editorState.width = newW;
editorState.height = newH;
editorState.grid = newGrid;

newState = gameStateFromEditor();
if (newState) currentState = newState;

assert.strictEqual(currentState.width, 6, "State width should be 6");
console.log("Test 3 Passed");

console.log("Debugging Complete.");
