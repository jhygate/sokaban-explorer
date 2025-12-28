/**
 * Handles exploration of the game state tree.
 */
export class GameTree {
    /**
     * Finds a solution using Breadth-First Search (BFS).
     * @param {GameState} startState 
     * @returns {string[] | null} Array of moves to solve, or null if unsolvable.
     */
    static solveBFS(startState) {
        const queue = [{ state: startState, path: [] }];
        const visited = new Set();
        visited.add(startState.getHash());

        let iterations = 0;
        const MAX_ITERATIONS = 50000; // Safety break

        while (queue.length > 0) {
            if (iterations++ > MAX_ITERATIONS) {
                console.warn("BFS limit reached");
                return null;
            }

            const { state, path } = queue.shift();

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
    static buildGraph(startState, maxNodes = 1000) {
        const nodes = [];
        const links = [];
        const visited = new Map(); // hash -> nodeId
        const queue = [startState];

        // Add start node
        const startHash = startState.getHash();
        visited.set(startHash, 0);
        nodes.push({ id: 0, state: startState, group: 'start' });

        let nextId = 1;

        while (queue.length > 0 && nodes.length < maxNodes) {
            const currentState = queue.shift();
            const currentId = visited.get(currentState.getHash());

            const moves = currentState.getAvailableMoves();
            for (const move of moves) {
                const nextState = currentState.applyMove(move);
                const nextHash = nextState.getHash();

                let nextNodeId;
                if (visited.has(nextHash)) {
                    nextNodeId = visited.get(nextHash);
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
