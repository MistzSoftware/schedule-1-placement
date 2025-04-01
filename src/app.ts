import './style.css';
import { Canvas, Rect, Line } from 'fabric';

// Grid configuration
const gridSize = 50;
const canvasWidth = 10 * gridSize; // Width of the lower part
const canvasHeight = (7 + 6) * gridSize; // Combined height of top and lower parts

// Initialize canvas
const canvas = new Canvas('canvas', {
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: '#f0f0f0',
    selection: false,
});

// Create a clipping region to simulate the L-shape
function applyClippingRegion() {
    canvas.on('before:render', () => {
        const ctx = canvas.getContext();
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 5 * gridSize, 7 * gridSize); // Top part
        ctx.rect(0, 7 * gridSize, 10 * gridSize, 6 * gridSize); // Lower part
        ctx.clip();
    });

    canvas.on('after:render', () => {
        const ctx = canvas.getContext();
        ctx.restore();
    });
}

// Create L-shaped grid
function createLShapedGrid() {
    const addVerticalLines = (startX: number, endX: number, startY: number, endY: number) => {
        for (let x = startX; x <= endX; x += gridSize) {
        canvas.add(new Line([x, startY, x, endY], {
            stroke: '#ddd',
            selectable: false,
            evented: false,
        }));
        }
    };

    const addHorizontalLines = (startX: number, endX: number, startY: number, endY: number) => {
        for (let y = startY; y <= endY; y += gridSize) {
        canvas.add(new Line([startX, y, endX, y], {
            stroke: '#ddd',
            selectable: false,
            evented: false,
        }));
        }
    };

  // Top part: 5 tiles by 7 tiles
  addVerticalLines(0, 5 * gridSize, 0, 7 * gridSize);
  addHorizontalLines(0, 5 * gridSize, 0, 7 * gridSize);

  // Lower part: 10 tiles by 6 tiles
  addVerticalLines(0, 10 * gridSize, 7 * gridSize, canvasHeight);
  addHorizontalLines(0, 10 * gridSize, 7 * gridSize, canvasHeight);
}

// Add a test object
function addTestObject() {
    const rect = new Rect({
        left: 100,
        top: 100,
        fill: 'rgba(255, 0, 0, 0.5)',
        width: 100,
        height: 100,
        hasControls: false,
        hasBorders: true,
    });
    canvas.add(rect);
}

// Snap objects to the grid and restrict movement to the L-shaped bounds
function enableSnapping() {
    canvas.on('object:moving', (e) => {
        if (!e.target) return;

        const target = e.target;

        // Snap to grid
        let snappedLeft = Math.round(target.left / gridSize) * gridSize;
        let snappedTop = Math.round(target.top / gridSize) * gridSize;

        // Restrict movement to the L-shaped bounds
        if (snappedTop < 7 * gridSize && snappedLeft >= 5 * gridSize) {
        snappedLeft = 5 * gridSize - target.width;
        }
        if (snappedTop >= 7 * gridSize && snappedLeft >= 10 * gridSize) {
        snappedLeft = 10 * gridSize - target.width;
        }

        if (snappedLeft < 0) snappedLeft = 0;
        if (snappedTop < 0) snappedTop = 0;

        if (snappedTop < 7 * gridSize && snappedLeft + target.width > 5 * gridSize) {
        snappedLeft = 5 * gridSize - target.width;
        }
        if (snappedTop >= 7 * gridSize && snappedLeft + target.width > 10 * gridSize) {
        snappedLeft = 10 * gridSize - target.width;
        }

        if (snappedTop + target.height > canvas.height) {
        snappedTop = canvas.height - target.height;
        }

        target.set({
        left: snappedLeft,
        top: snappedTop,
        });

        canvas.requestRenderAll();
    });
}

// Initialize the canvas
function initializeCanvas() {
    applyClippingRegion();
    createLShapedGrid();
    addTestObject();
    enableSnapping();
}

initializeCanvas();