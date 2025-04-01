import './style.css';
import { Canvas, Rect, Line, Text, Group } from 'fabric'; // Import Text and Group

// Grid configuration
const tileSize = 50;
const canvasWidth = 10 * tileSize; // Width of the lower part
const canvasHeight = (7 + 6) * tileSize; // Combined height of top and lower parts

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
        ctx.rect(0, 0, 5 * tileSize, 7 * tileSize); // Top part
        ctx.rect(0, 7 * tileSize, 10 * tileSize, 6 * tileSize); // Lower part
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
        for (let x = startX; x <= endX; x += tileSize) {
        canvas.add(new Line([x, startY, x, endY], {
            stroke: '#ddd',
            selectable: false,
            evented: false,
        }));
        }
    };

    const addHorizontalLines = (startX: number, endX: number, startY: number, endY: number) => {
        for (let y = startY; y <= endY; y += tileSize) {
        canvas.add(new Line([startX, y, endX, y], {
            stroke: '#ddd',
            selectable: false,
            evented: false,
        }));
        }
    };

  // Top part: 5 tiles by 7 tiles
  addVerticalLines(0, 5 * tileSize, 0, 7 * tileSize);
  addHorizontalLines(0, 5 * tileSize, 0, 7 * tileSize);

  // Lower part: 10 tiles by 6 tiles
  addVerticalLines(0, 10 * tileSize, 7 * tileSize, canvasHeight);
  addHorizontalLines(0, 10 * tileSize, 7 * tileSize, canvasHeight);
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
        let snappedLeft = Math.round(target.left / tileSize) * tileSize;
        let snappedTop = Math.round(target.top / tileSize) * tileSize;

        // Restrict movement to the L-shaped bounds
        if (snappedTop < 7 * tileSize && snappedLeft >= 5 * tileSize) {
        snappedLeft = 5 * tileSize - target.width;
        }
        if (snappedTop >= 7 * tileSize && snappedLeft >= 10 * tileSize) {
        snappedLeft = 10 * tileSize - target.width;
        }

        if (snappedLeft < 0) snappedLeft = 0;
        if (snappedTop < 0) snappedTop = 0;

        if (snappedTop < 7 * tileSize && snappedLeft + target.width > 5 * tileSize) {
        snappedLeft = 5 * tileSize - target.width;
        }
        if (snappedTop >= 7 * tileSize && snappedLeft + target.width > 10 * tileSize) {
        snappedLeft = 10 * tileSize - target.width;
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

// Check for collisions with existing objects or grid bounds
function isPlacementValid(left: number, top: number, width: number, height: number): boolean {
    console.log('Checking placement validity:', { left, top, width, height });

    // Check if the shape is out of bounds
    if (left < 0 || top < 0 || left + width > canvasWidth || top + height > canvasHeight) {
        return false;
    }

    // Check for collisions with existing objects
    const objects = canvas.getObjects().filter((obj) => obj.evented || obj.selectable); // Exclude grid lines
    for (const obj of objects) {
        const objLeft = obj.left || 0;
        const objTop = obj.top || 0;
        const objWidth = Math.floor(obj.getScaledWidth() / tileSize) * tileSize;
        const objHeight = Math.floor(obj.getScaledHeight() / tileSize) * tileSize;

        const isOverlapping =
        left < objLeft + objWidth &&
        left + width > objLeft &&
        top < objTop + objHeight &&
        top + height > objTop;

        if (isOverlapping) {
        return false;
        }
    }

    return true;
}

function enableDragAndDrop() {
    const emojiItems = document.querySelectorAll('.emoji-item');

    emojiItems.forEach((item) => {
        item.addEventListener('dragstart', (e) => {
            const dragEvent = e as DragEvent; // Explicitly cast the event to DragEvent
            if (!dragEvent.dataTransfer) return;
            const width = (item as HTMLElement).dataset.width;
            const height = (item as HTMLElement).dataset.height;
            dragEvent.dataTransfer.setData('width', width || '1');
            dragEvent.dataTransfer.setData('height', height || '1');
        });
    });

    const canvasContainer = canvas.getElement().parentElement; // Get the parent container of the Fabric.js canvas
    canvasContainer?.addEventListener('dragover', (e) => {
        const dragEvent = e as DragEvent; // Explicitly cast the event to DragEvent
        dragEvent.preventDefault();
    });

    canvasContainer?.addEventListener('drop', (e) => {
        const dragEvent = e as DragEvent; // Explicitly cast the event to DragEvent
        dragEvent.preventDefault();
        if (!dragEvent.dataTransfer) return;

        const widthInTiles = parseInt(dragEvent.dataTransfer.getData('width'), 10);
        const heightInTiles = parseInt(dragEvent.dataTransfer.getData('height'), 10);

        // Calculate snapped position
        const rectLeft = Math.floor(dragEvent.offsetX / tileSize) * tileSize;
        const rectTop = Math.floor(dragEvent.offsetY / tileSize) * tileSize;
        const rectWidth = widthInTiles * tileSize;
        const rectHeight = heightInTiles * tileSize;

        // Check if placement is valid
        if (!isPlacementValid(rectLeft, rectTop, rectWidth, rectHeight)) {
            alert('Invalid placement: Collision detected or out of bounds.');
            return;
        }

        const rect = new Rect({
            left: rectLeft,
            top: rectTop,
            fill: 'rgba(0, 128, 255, 0.3)',
            stroke: '#007bff',
            strokeWidth: 2,
            width: rectWidth,
            height: rectHeight,
            hasControls: false,
            hasBorders: true,
        });

        canvas.add(rect);
        canvas.requestRenderAll();
    });
}

// Initialize the canvas
function initializeCanvas() {
    applyClippingRegion();
    createLShapedGrid();
    addTestObject();
    enableSnapping();
    enableDragAndDrop();
}

initializeCanvas();