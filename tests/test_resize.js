import assert from 'assert';

// Mock Editor State
let editorState = {
    width: 3,
    height: 3,
    grid: [
        ['#', '#', '#'],
        ['#', '@', '#'],
        ['#', '#', '#']
    ]
};

function resizeEditorGrid(newWidth, newHeight) {
    const oldGrid = editorState.grid;
    const newGrid = Array(newHeight).fill(null).map(() => Array(newWidth).fill(' '));

    for (let y = 0; y < Math.min(editorState.height, newHeight); y++) {
        for (let x = 0; x < Math.min(editorState.width, newWidth); x++) {
            newGrid[y][x] = oldGrid[y][x];
        }
    }

    editorState.width = newWidth;
    editorState.height = newHeight;
    editorState.grid = newGrid;
}

console.log("Running Grid Resize tests...");

// Test 1: Expand
resizeEditorGrid(4, 4);
assert.strictEqual(editorState.width, 4);
assert.strictEqual(editorState.height, 4);
assert.strictEqual(editorState.grid[1][1], '@'); // Preserved
assert.strictEqual(editorState.grid[3][3], ' '); // New space
console.log("Test 1 Passed: Expand");

// Test 2: Crop
resizeEditorGrid(2, 2);
assert.strictEqual(editorState.width, 2);
assert.strictEqual(editorState.height, 2);
assert.strictEqual(editorState.grid[1][1], '@'); // Preserved
// assert.strictEqual(editorState.grid[2], undefined); // Cropped
console.log("Test 2 Passed: Crop");

console.log("All Grid Resize tests passed!");
