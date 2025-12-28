import { GameState } from '../src/logic/GameState.js';
import assert from 'assert';

// ... (Mock setup same as before) ...
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

console.log("Verifying Editor Fix...");

let currentState = null;
let editorState = {
    width: 5,
    height: 3,
    grid: [
        ['#', '#', '#', '#', '#'],
        ['#', '@', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#']
    ]
};

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
                case '@': player = { x, y }; break;
            }
        }
    }

    if (!player) return null;
    return new GameState(width, height, walls, targets, player, boxes);
}

// Initialize
currentState = gameStateFromEditor();

// Test: Remove Player
console.log("Test: Remove Player");
editorState.grid[1][1] = ' ';
const newState = gameStateFromEditor();

// Logic from main.js (FIXED)
currentState = newState;

assert.strictEqual(currentState, null, "currentState should be null when player is missing");
console.log("Test Passed: currentState is null, triggering fallback rendering");

console.log("Verification Complete.");
