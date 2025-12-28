export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 40;
    }

    render(gameState) {
        const { width, height, walls, targets, player, boxes } = gameState;

        // Resize canvas to fit the level
        this.canvas.width = width * this.tileSize;
        this.canvas.height = height * this.tileSize;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid/Background
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const isWall = walls[y][x];
                const isTarget = targets[y][x];

                if (isWall) {
                    this.drawWall(x, y);
                } else if (isTarget) {
                    this.drawTarget(x, y);
                } else {
                    this.drawFloor(x, y);
                }
            }
        }

        // Draw Boxes
        boxes.forEach(box => {
            const isOnTarget = targets[box.y][box.x];
            this.drawBox(box.x, box.y, isOnTarget);
        });

        // Draw Player
        this.drawPlayer(player.x, player.y);
    }

    drawWall(x, y) {
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        this.ctx.strokeStyle = '#444';
        this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
    }

    drawFloor(x, y) {
        this.ctx.fillStyle = '#3d3d3d';
        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
    }

    drawTarget(x, y) {
        this.drawFloor(x, y);
        this.ctx.fillStyle = '#a44';
        this.ctx.beginPath();
        this.ctx.arc(
            x * this.tileSize + this.tileSize / 2,
            y * this.tileSize + this.tileSize / 2,
            this.tileSize / 4,
            0, Math.PI * 2
        );
        this.ctx.fill();
    }

    drawBox(x, y, onTarget) {
        this.ctx.fillStyle = onTarget ? '#4a4' : '#c84';
        const padding = 4;
        this.ctx.fillRect(
            x * this.tileSize + padding,
            y * this.tileSize + padding,
            this.tileSize - padding * 2,
            this.tileSize - padding * 2
        );
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            x * this.tileSize + padding,
            y * this.tileSize + padding,
            this.tileSize - padding * 2,
            this.tileSize - padding * 2
        );
    }

    drawPlayer(x, y) {
        this.ctx.fillStyle = '#48c';
        this.ctx.beginPath();
        this.ctx.arc(
            x * this.tileSize + this.tileSize / 2,
            y * this.tileSize + this.tileSize / 2,
            this.tileSize / 2.5,
            0, Math.PI * 2
        );
        this.ctx.fill();
    }
}
