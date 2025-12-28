import { GameState } from '../src/logic/GameState.js';
import { GameTree } from '../src/logic/GameTree.js';
import assert from 'assert';

console.log("Running GameTree Graph tests...");

// Simple Level
const levelStr = `
#####
#@$.#
#####
`;
const state = GameState.fromString(levelStr);

// Build Graph
const { nodes, links } = GameTree.buildGraph(state, 100);

console.log(`Generated ${nodes.length} nodes and ${links.length} links.`);

// Basic Checks
assert.ok(nodes.length > 0, "Should generate nodes");
assert.ok(nodes.find(n => n.group === 'start'), "Should have a start node");
assert.ok(nodes.find(n => n.group === 'solved'), "Should have a solved node (for this simple level)");
assert.ok(links.length > 0, "Should generate links");

// Check Link Structure
const link = links[0];
assert.ok(link.source !== undefined, "Link should have source");
assert.ok(link.target !== undefined, "Link should have target");
assert.ok(link.label, "Link should have label (move)");

console.log("All GameTree Graph tests passed!");
