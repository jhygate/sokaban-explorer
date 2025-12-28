import { Renderer } from './Renderer.js';

export class TreeVisualizer {
    addGradientDefinition() {
        // Create SVG element with gradient definition
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'arrow-gradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '0%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('style', 'stop-color:#f44336;stop-opacity:1'); // Red at source

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('style', 'stop-color:#4CAF50;stop-opacity:1'); // Green at target

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
        document.body.appendChild(svg);
    }

    constructor(containerId) {
        this.container = document.getElementById(containerId);

        // Add SVG gradient definition for directional arrows
        this.addGradientDefinition();

        this.graph = ForceGraph3D()(this.container)
            .nodeLabel('id')
            .nodeColor(node => {
                if (node.group === 'start') return '#2196F3'; // Blue
                if (node.group === 'solved') return '#4CAF50'; // Green
                return '#ff9800'; // Orange
            })
            .nodeVal(node => node.group === 'start' || node.group === 'solved' ? 20 : 10)
            .linkLabel('label')
            .linkDirectionalArrowLength(1) // Much larger arrows for visibility
            .linkDirectionalArrowRelPos(1)
            .linkWidth(3) // Thicker links to show gradient better
            .linkColor(() => 'url(#arrow-gradient)') // Use gradient for directional flow
            .linkDirectionalArrowColor(() => '#4CAF50') // Green arrow tip
            // Physics Optimization
            .d3Force('z', d3.forceZ(0).strength(0.5)) // Flattening force
            .d3Force('charge', d3.forceManyBody()
                .strength(-60) // Repulsion strength
                .distanceMax(Infinity) // No limit on repulsion distance
                .theta(0) // More accurate long-range calculations (slower decay)
            )
            .d3Force('collide', d3.forceCollide(15)) // Prevent overlap
            .d3AlphaDecay(0) // No decay, constant simulation
            .d3AlphaMin(0) // Never stop the simulation
            .onNodeClick(node => {
                console.log("Node clicked:", node);
                // Render state to preview overlay
                const overlay = document.getElementById('state-preview-overlay');
                const previewCanvas = document.getElementById('previewCanvas');
                overlay.style.display = 'block';

                const scale = 30; // Larger scale for preview
                previewCanvas.width = node.state.width * scale;
                previewCanvas.height = node.state.height * scale;

                const renderer = new Renderer(previewCanvas);
                renderer.tileSize = scale;
                renderer.render(node.state);

                // Trigger callback
                if (this.onNodeClickCallback) this.onNodeClickCallback(node.state);
            });

        // Configure Controls
        const controls = this.graph.controls();
        if (controls) {
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.screenSpacePanning = true; // Fixes "weird rotation" after panning
        }
    }

    render(graphData) {
        this.graph.graphData(graphData);

        // Build map for quick lookup
        this.nodeMap = new Map();
        graphData.nodes.forEach(node => {
            this.nodeMap.set(node.state.getHash(), node);
        });
    }

    highlightState(state) {
        if (!this.nodeMap) return;

        const hash = state.getHash();
        const node = this.nodeMap.get(hash);

        // Reset all nodes color
        this.graph.nodeColor(n => {
            if (n === node) return '#FF00FF'; // Magenta for current state
            if (this.solutionPathSet && this.solutionPathSet.has(n.id)) return '#FFFF00'; // Yellow for solution
            if (n.group === 'start') return '#2196F3';
            if (n.group === 'solved') return '#4CAF50';
            return '#ff9800';
        });

        // Update overlay if node found
        if (node) {
            // Optional: Auto-focus or just update overlay?
            // Let's just update the overlay if it's open
            const overlay = document.getElementById('state-preview-overlay');
            if (overlay.style.display !== 'none') {
                // Update preview
                const previewCanvas = document.getElementById('previewCanvas');
                const scale = 30;
                previewCanvas.width = state.width * scale;
                previewCanvas.height = state.height * scale;
                const renderer = new Renderer(previewCanvas);
                renderer.tileSize = scale;
                renderer.render(state);
            }
        }
    }

    highlightPath(pathNodes) {
        this.solutionPathSet = new Set(pathNodes.map(n => n.id));
        // Trigger re-render of colors
        this.graph.nodeColor(this.graph.nodeColor());
    }

    setOnNodeClick(callback) {
        this.onNodeClickCallback = callback;
    }

    setZoom(distance) {
        // Get current camera position
        const camera = this.graph.camera();
        const controls = this.graph.controls();

        if (!camera || !controls) return;

        // Calculate direction from target (center of rotation) to camera
        const target = controls.target;
        const direction = {
            x: camera.position.x - target.x,
            y: camera.position.y - target.y,
            z: camera.position.z - target.z
        };

        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        if (length === 0) return;

        const normalized = {
            x: direction.x / length,
            y: direction.y / length,
            z: direction.z / length
        };

        // Set new position based on distance
        this.graph.cameraPosition(
            {
                x: target.x + normalized.x * distance,
                y: target.y + normalized.y * distance,
                z: target.z + normalized.z * distance
            },
            target, // Look at target
            200 // Transition duration
        );
    }

    updateCharge(strength) {
        this.graph.d3Force('charge', d3.forceManyBody()
            .strength(strength)
            .distanceMax(Infinity)
            .theta(this.currentTheta || 0)
        );
    }

    updateZForce(strength) {
        this.graph.d3Force('z', d3.forceZ(0).strength(strength));
    }

    updateCollision(radius) {
        this.graph.d3Force('collide', d3.forceCollide(radius));
    }

    updateLinkWidth(width) {
        this.graph.linkWidth(width);
    }

    updateArrowLength(length) {
        this.graph.linkDirectionalArrowLength(length);
    }

    updateTheta(theta) {
        this.currentTheta = theta;
        this.graph.d3Force('charge', d3.forceManyBody()
            .strength(this.currentCharge || -60)
            .distanceMax(Infinity)
            .theta(theta)
        );
    }
}
