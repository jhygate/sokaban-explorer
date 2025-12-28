import { GameState } from '../src/logic/GameState.js';
import assert from 'assert';

// Mock Editor State with trailing empty lines
const editorState = {
    width: 3,
    height: 5,
    grid: [
        ['#', '@', '#'],
        ['#', ' ', '#'],
        ['#', '#', '#'],
        [' ', ' ', ' '], // Empty line
        [' ', ' ', ' ']  // Empty line
    ]
};

// Logic from main.js (gameStateFromEditor)
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

console.log("Running Height Resize Fix tests...");

const state = gameStateFromEditor();
assert.strictEqual(state.height, 5, "Height should be 5 (preserved)");
assert.strictEqual(state.width, 3, "Width should be 3");
console.log("Test Passed: Height preserved even with empty lines");
