import { GameState } from './GameState';
import { GraphNode, GraphLink, Move } from '../types';

/**
 * Handles exploration of the game state tree.
 */
export class GameTree {
    /**
     * Finds a solution using Breadth-First Search (BFS).
     * @param {GameState} startState 
     * @returns {string[] | null} Array of moves to solve, or null if unsolvable.
     */
    static solveBFS(startState: GameState): Move[] | null {
        const queue: { state: GameState; path: Move[] }[] = [{ state: startState, path: [] }];
        const visited = new Set<string>();
        visited.add(startState.getHash());

        let iterations = 0;
        const MAX_ITERATIONS = 50000; // Safety break

        while (queue.length > 0) {
            if (iterations++ > MAX_ITERATIONS) {
                console.warn("BFS limit reached");
                return null;
            }

            const item = queue.shift();
            if (!item) break;
            const { state, path } = item;

            if (state.isSolved()) {
                return path;
            }

            const moves = state.getAvailableMoves();
            for (const move of moves) {
                const nextState = state.applyMove(move);
                const hash = nextState.getHash();

                if (!visited.has(hash)) {
                    visited.add(hash);
                    queue.push({ state: nextState, path: [...path, move] });
                }
            }
        }

        return null; // No solution found
    }

    /**
     * Builds a graph of the state space.
     * @param {GameState} startState 
     * @param {number} maxNodes 
     * @returns {{nodes: Array, links: Array}}
     */
    static buildGraph(startState: GameState, maxNodes: number = 1000): { nodes: GraphNode[]; links: GraphLink[] } {
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const visited = new Map<string, number>(); // hash -> nodeId
        const queue: GameState[] = [startState];

        // Add start node
        const startHash = startState.getHash();
        visited.set(startHash, 0);
        nodes.push({ id: 0, state: startState, group: 'start' });

        let nextId = 1;

        while (queue.length > 0 && nodes.length < maxNodes) {
            const currentState = queue.shift();
            if (!currentState) break;
            
            const currentId = visited.get(currentState.getHash());
            if (currentId === undefined) continue;

            const moves = currentState.getAvailableMoves();
            for (const move of moves) {
                const nextState = currentState.applyMove(move);
                const nextHash = nextState.getHash();

                let nextNodeId: number;
                if (visited.has(nextHash)) {
                    nextNodeId = visited.get(nextHash)!;
                } else {
                    nextNodeId = nextId++;
                    visited.set(nextHash, nextNodeId);
                    const isSolved = nextState.isSolved();
                    nodes.push({
                        id: nextNodeId,
                        state: nextState,
                        group: isSolved ? 'solved' : 'default'
                    });
                    queue.push(nextState);
                }

                links.push({ source: currentId, target: nextNodeId, label: move });
            }
        }

        return { nodes, links };
    }
}
