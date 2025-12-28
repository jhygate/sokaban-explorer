/**
 * Represents a single state in the Sokoban game.
 * Immutable design to facilitate game tree exploration.
 */
export class GameState {
  /**
   * @param {number} width
   * @param {number} height
   * @param {boolean[][]} walls - true if wall
   * @param {boolean[][]} targets - true if target
   * @param {{x: number, y: number}} player
   * @param {{x: number, y: number}[]} boxes
   */
  constructor(width, height, walls, targets, player, boxes) {
    this.width = width;
    this.height = height;
    this.walls = walls;
    this.targets = targets;
    this.player = player;
    // Sort boxes to ensure canonical state representation for hashing
    this.boxes = boxes.sort((a, b) => a.y - b.y || a.x - b.x);
  }

  /**
   * Returns a unique string representation of the state.
   * Useful for visited sets in search algorithms.
   */
  getHash() {
    const boxesStr = this.boxes.map(b => `${b.x},${b.y}`).join('|');
    return `${this.player.x},${this.player.y}|${boxesStr}`;
  }

  /**
   * Checks if a coordinate is within bounds.
   */
  isValid(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Checks if a coordinate is a wall.
   */
  isWall(x, y) {
    return this.isValid(x, y) && this.walls[y][x];
  }

  /**
   * Checks if a coordinate has a box.
   * @returns {number} index of box or -1
   */
  getBoxIndex(x, y) {
    return this.boxes.findIndex(b => b.x === x && b.y === y);
  }

  /**
   * Returns a list of valid moves: 'U', 'D', 'L', 'R'.
   */
  getAvailableMoves() {
    const moves = [];
    const directions = [
      { key: 'U', dx: 0, dy: -1 },
      { key: 'D', dx: 0, dy: 1 },
      { key: 'L', dx: -1, dy: 0 },
      { key: 'R', dx: 1, dy: 0 }
    ];

    for (const dir of directions) {
      const newX = this.player.x + dir.dx;
      const newY = this.player.y + dir.dy;

      if (!this.isValid(newX, newY) || this.isWall(newX, newY)) {
        continue;
      }

      const boxIndex = this.getBoxIndex(newX, newY);
      if (boxIndex !== -1) {
        // Check if box can be pushed
        const pushX = newX + dir.dx;
        const pushY = newY + dir.dy;
        if (!this.isValid(pushX, pushY) || this.isWall(pushX, pushY) || this.getBoxIndex(pushX, pushY) !== -1) {
          continue; // Blocked
        }
      }
      moves.push(dir.key);
    }
    return moves;
  }

  /**
   * Applies a move and returns a NEW GameState.
   * Assumes the move is valid (check getAvailableMoves first or handle logic here).
   */
  applyMove(moveKey) {
    const directions = {
      'U': { dx: 0, dy: -1 },
      'D': { dx: 0, dy: 1 },
      'L': { dx: -1, dy: 0 },
      'R': { dx: 1, dy: 0 }
    };
    const dir = directions[moveKey];
    if (!dir) return this;

    const newX = this.player.x + dir.dx;
    const newY = this.player.y + dir.dy;

    // Check validity again just in case (or rely on caller)
    if (!this.isValid(newX, newY) || this.isWall(newX, newY)) return this;

    let newBoxes = [...this.boxes];
    const boxIndex = this.getBoxIndex(newX, newY);

    if (boxIndex !== -1) {
      const pushX = newX + dir.dx;
      const pushY = newY + dir.dy;
      // Check push validity
      if (!this.isValid(pushX, pushY) || this.isWall(pushX, pushY) || this.getBoxIndex(pushX, pushY) !== -1) {
        return this;
      }
      // Move box
      newBoxes[boxIndex] = { x: pushX, y: pushY };
    }

    return new GameState(
      this.width,
      this.height,
      this.walls, // Shared reference (walls don't change)
      this.targets, // Shared reference
      { x: newX, y: newY },
      newBoxes
    );
  }

  isSolved() {
    return this.boxes.every(b => this.targets[b.y][b.x]);
  }

  /**
   * Parses a standard Sokoban level string.
   * @param {string} levelStr
   */
  static fromString(levelStr) {
    const lines = levelStr.trim().split('\n');
    const height = lines.length;
    const width = Math.max(...lines.map(l => l.length));

    const walls = Array(height).fill(null).map(() => Array(width).fill(false));
    const targets = Array(height).fill(null).map(() => Array(width).fill(false));
    let player = null;
    const boxes = [];

    lines.forEach((line, y) => {
      line.split('').forEach((char, x) => {
        switch (char) {
          case '#': walls[y][x] = true; break;
          case '.': targets[y][x] = true; break;
          case '$': boxes.push({ x, y }); break;
          case '*': boxes.push({ x, y }); targets[y][x] = true; break;
          case '@': player = { x, y }; break;
          case '+': player = { x, y }; targets[y][x] = true; break;
        }
      });
    });

    if (!player) throw new Error("Level missing player start position (@ or +)");

    return new GameState(width, height, walls, targets, player, boxes);
  }
}
