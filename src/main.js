import { GameState } from './logic/GameState.js';
import { Renderer } from './ui/Renderer.js';
import { LevelManager } from './logic/LevelManager.js';
import { GameTree } from './logic/GameTree.js';
import { TreeVisualizer } from './ui/TreeVisualizer.js';

const canvas = document.getElementById('gameCanvas');
const statusDiv = document.getElementById('status');
const levelSelect = document.getElementById('levelSelect');
const paletteDiv = document.getElementById('palette');
const renderer = new Renderer(canvas);
const levelManager = new LevelManager();
let treeVisualizer = null;

let currentState = null;
let currentLevelName = 'Default Level';
let selectedTile = '#';
let editorState = { width: 10, height: 10, grid: [] }; // Simplified grid for editing
let undoStack = [];

// Initialize
function init() {
    const levels = levelManager.getLevels();
    if (!levels[currentLevelName]) {
        const firstLevel = Object.keys(levels)[0];
        if (firstLevel) {
            currentLevelName = firstLevel;
        }
    }
    refreshLevelList();
    loadLevel(currentLevelName);
    setupEventListeners();
}

function refreshLevelList() {
    const levels = levelManager.getLevels();
    levelSelect.innerHTML = '';
    for (const name of Object.keys(levels)) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        if (name === currentLevelName) option.selected = true;
        levelSelect.appendChild(option);
    }
}

function loadLevel(name) {
    currentLevelName = name;
    const levelStr = levelManager.getLevel(name);

    if (!levelStr) {
        console.error("Level not found:", name);
        statusDiv.textContent = "Error: Level not found.";
        return;
    }

    try {
        currentState = GameState.fromString(levelStr);
        undoStack = []; // Reset history
        statusDiv.textContent = "";
        // Initialize editor grid from state
        initEditorGridFromState(currentState);

        // Sync inputs
        document.getElementById('widthInput').value = currentState.width;
        document.getElementById('heightInput').value = currentState.height;

    } catch (e) {
        console.error("Failed to load level", e);
        statusDiv.textContent = "Error loading level.";
    }
    update();
}

function initEditorGridFromState(state) {
    editorState.width = state.width;
    editorState.height = state.height;
    editorState.grid = Array(state.height).fill(null).map(() => Array(state.width).fill(' '));

    for (let y = 0; y < state.height; y++) {
        for (let x = 0; x < state.width; x++) {
            if (state.walls[y][x]) editorState.grid[y][x] = '#';
            else if (state.targets[y][x]) editorState.grid[y][x] = '.';
        }
    }
    state.boxes.forEach(b => {
        if (editorState.grid[b.y][b.x] === '.') editorState.grid[b.y][b.x] = '*';
        else editorState.grid[b.y][b.x] = '$';
    });
    if (state.player) {
        if (editorState.grid[state.player.y][state.player.x] === '.') editorState.grid[state.player.y][state.player.x] = '+';
        else editorState.grid[state.player.y][state.player.x] = '@';
    }
}

function update() {
    if (currentState) {
        renderer.render(currentState);
        if (currentState.isSolved()) {
            statusDiv.textContent = "Level Solved!";
        }

        // Sync Graph
        if (treeVisualizer && document.getElementById('graph-modal').style.display !== 'none') {
            treeVisualizer.highlightState(currentState);
        }
    } else {
        drawEditorGrid();
    }
}

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

function drawEditorGrid() {
    // Fallback rendering for editor if GameState fails (e.g. no player)
    const tileSize = 40;
    canvas.width = editorState.width * tileSize;
    canvas.height = editorState.height * tileSize;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < editorState.height; y++) {
        for (let x = 0; x < editorState.width; x++) {
            const char = editorState.grid[y][x];
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            ctx.fillStyle = '#222';
            ctx.font = '20px monospace';
            ctx.fillText(char, x * tileSize + 10, y * tileSize + 25);
        }
    }
}

function gridToString() {
    return editorState.grid.map(row => row.join('')).join('\n');
}

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

    // Auto-save and update state
    autoSave();
    const newState = gameStateFromEditor();
    currentState = newState; // Allow null (invalid state) to trigger fallback rendering
}

function autoSave() {
    const levelStr = gridToString();
    levelManager.saveLevel(currentLevelName, levelStr);
}

function setupEventListeners() {
    // Level Select
    levelSelect.addEventListener('change', (e) => {
        loadLevel(e.target.value);
    });

    // Sync inputs with current size
    document.getElementById('widthInput').value = editorState.width;
    document.getElementById('heightInput').value = editorState.height;

    // Resize Grid
    document.getElementById('resizeBtn').addEventListener('click', () => {
        const newW = parseInt(document.getElementById('widthInput').value);
        const newH = parseInt(document.getElementById('heightInput').value);
        if (newW < 3 || newH < 3) {
            alert("Minimum size is 3x3");
            return;
        }
        resizeEditorGrid(newW, newH);
        update();
    });

    // Explore Tree
    document.getElementById('exploreBtn').addEventListener('click', () => {
        const graphModal = document.getElementById('graph-modal');
        graphModal.style.display = 'block';

        statusDiv.textContent = "Building Game Tree...";

        setTimeout(() => {
            const graphData = GameTree.buildGraph(currentState, 5000);
            if (!treeVisualizer) {
                treeVisualizer = new TreeVisualizer('graph-container');
                treeVisualizer.setOnNodeClick((state) => {
                    console.log("Node clicked:", state);
                    // Teleport game to this state
                    currentState = state;
                    undoStack.push(currentState); // Add to history so we can undo the teleport? Or maybe clear history?
                    // Let's just update.
                    update();
                });
            }
            treeVisualizer.render(graphData);
            statusDiv.textContent = `Graph built: ${graphData.nodes.length} nodes.`;

            // Highlight current state immediately
            treeVisualizer.highlightState(currentState);
        }, 50);
    });

    document.getElementById('closeGraphBtn').addEventListener('click', () => {
        document.getElementById('graph-container').style.display = 'none';
    });

    // Palette
    document.querySelectorAll('.palette-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedTile = e.target.dataset.tile;
        });
    });

    // Canvas Click (Editor)
    canvas.addEventListener('mousedown', (e) => {
        handlePaint(e);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (e.buttons !== 1) return;
        handlePaint(e);
    });

    // Buttons
    document.getElementById('newLevelBtn').addEventListener('click', () => {
        const name = prompt("Enter new level name:");
        if (name) {
            const emptyLevel =
                `#####
#@  #
#####`;
            levelManager.saveLevel(name, emptyLevel);
            refreshLevelList();
            levelSelect.value = name;
            loadLevel(name);
        }
    });

    // Save button removed (Auto-save)

    document.getElementById('deleteLevelBtn').addEventListener('click', () => {
        if (confirm(`Delete level "${currentLevelName}"?`)) {
            levelManager.deleteLevel(currentLevelName);
            refreshLevelList();
            refreshLevelList();
            // Load first available
            const levels = levelManager.getLevels();
            const first = Object.keys(levels)[0];
            if (first) {
                loadLevel(first);
            } else {
                // No levels left, create a default one
                levelManager.saveLevel('Default Level',
                    `#####
#@  #
#####`);
                refreshLevelList();
                loadLevel('Default Level');
            }
        }
    });

    // Close Graph Button
    document.getElementById('closeGraphBtn').addEventListener('click', () => {
        document.getElementById('graph-modal').style.display = 'none';
        document.getElementById('state-preview-overlay').style.display = 'none';
    });

    // Graph Undo Button
    document.getElementById('graphUndoBtn').addEventListener('click', () => {
        undo();
    });

    // Zoom Slider
    document.getElementById('zoomSlider').addEventListener('input', (e) => {
        if (treeVisualizer) {
            treeVisualizer.setZoom(parseInt(e.target.value));
        }
    });

    // Physics Control Sliders
    document.getElementById('chargeSlider').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('chargeValue').textContent = value;
        if (treeVisualizer) treeVisualizer.updateCharge(value);
    });

    document.getElementById('zForceSlider').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('zForceValue').textContent = value;
        if (treeVisualizer) treeVisualizer.updateZForce(value);
    });

    document.getElementById('collideSlider').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('collideValue').textContent = value;
        if (treeVisualizer) treeVisualizer.updateCollision(value);
    });

    document.getElementById('linkWidthSlider').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('linkWidthValue').textContent = value;
        if (treeVisualizer) treeVisualizer.updateLinkWidth(value);
    });

    document.getElementById('arrowLengthSlider').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('arrowLengthValue').textContent = value;
        if (treeVisualizer) treeVisualizer.updateArrowLength(value);
    });

    document.getElementById('thetaSlider').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('thetaValue').textContent = value;
        if (treeVisualizer) treeVisualizer.updateTheta(value);
    });

    // Keyboard (Play Mode)
    window.addEventListener('keydown', (e) => {
        // Close Graph on Esc
        if (e.key === 'Escape') {
            document.getElementById('graph-modal').style.display = 'none';
            document.getElementById('state-preview-overlay').style.display = 'none';
            return;
        }

        // Allow movement always (unless focusing input)
        if (e.target.tagName === 'INPUT') return;

        let move = null;
        switch (e.key) {
            case 'ArrowUp': move = 'U'; break;
            case 'ArrowDown': move = 'D'; break;
            case 'ArrowLeft': move = 'L'; break;
            case 'ArrowRight': move = 'R'; break;
            case 'r':
            case 'R':
                loadLevel(currentLevelName);
                return;
            case 'z':
            case 'Z':
                undo();
                return;
            case 's':
            case 'S':
                solveLevel();
                return;
        }

        if (move && currentState) {
            const moves = currentState.getAvailableMoves();
            if (moves.includes(move)) {
                undoStack.push(currentState);
                currentState = currentState.applyMove(move);
                update();
            }
        }
    });
}

function undo() {
    if (undoStack.length > 0) {
        currentState = undoStack.pop();
        update();
        statusDiv.textContent = "Undid last move.";
    } else {
        statusDiv.textContent = "Nothing to undo.";
    }
}

function handlePaint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 40);
    const y = Math.floor((e.clientY - rect.top) / 40);

    if (x >= 0 && x < editorState.width && y >= 0 && y < editorState.height) {
        editorState.grid[y][x] = selectedTile;

        // Auto-save and update state
        autoSave();
        const newState = gameStateFromEditor();
        currentState = newState; // Allow null (invalid state) to trigger fallback rendering

        update();
    }
}

async function solveLevel() {
    statusDiv.textContent = "Solving...";
    setTimeout(() => {
        const solution = GameTree.solveBFS(currentState);
        if (solution) {
            statusDiv.textContent = `Solved in ${solution.length} moves! Animating...`;
            animateSolution(solution);

            // Visualize on Graph if open
            if (treeVisualizer && document.getElementById('graph-modal').style.display !== 'none') {
                // We need to reconstruct the path nodes
                // This is a bit tricky since solveBFS returns moves, not states.
                // But we can re-simulate to get hashes.
                // Actually, let's just let the animation sync the graph!
                // The user asked for "path marked in a colour".
                // So we should pre-calculate the path states.

                let tempState = currentState;
                const pathHashes = new Set();
                pathHashes.add(tempState.getHash());
                for (const move of solution) {
                    tempState = tempState.applyMove(move);
                    pathHashes.add(tempState.getHash());
                }

                // Find nodes in graph
                const pathNodes = [];
                if (treeVisualizer.nodeMap) {
                    pathHashes.forEach(hash => {
                        const node = treeVisualizer.nodeMap.get(hash);
                        if (node) pathNodes.push(node);
                    });
                    treeVisualizer.highlightPath(pathNodes);
                }
            }
        } else {
            statusDiv.textContent = "No solution found.";
        }
    }, 10);
}

function animateSolution(moves) {
    let i = 0;
    const interval = setInterval(() => {
        if (i >= moves.length) {
            clearInterval(interval);
            statusDiv.textContent = "Solution playback complete.";
            return;
        }
        const move = moves[i++];
        currentState = currentState.applyMove(move);
        update();
    }, 200);
}

init();
