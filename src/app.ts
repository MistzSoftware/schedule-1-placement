import './style.css';
import { Canvas, Rect, Line } from 'fabric';
import motelMap from './maps/motel.json';
import chineseApartmentMap from './maps/chinese_apartment.json';
import houseMap from './maps/house.json';

const tileSize = 50; // Size of each grid tile in pixels
let currentMap = motelMap; // Default map

// Initialize the Fabric.js canvas
const canvas = new Canvas('canvas', {
  width: 10 * tileSize,
  height: 13 * tileSize,
  backgroundColor: '#f0f0f0',
  selection: false,
});

/**
 * Validates if a placement is valid based on grid bounds, inactive areas, and collisions.
 * @param left - The left position of the object.
 * @param top - The top position of the object.
 * @param width - The width of the object.
 * @param height - The height of the object.
 * @param excludeObject - The object to exclude from collision checks.
 * @returns True if the placement is valid, false otherwise.
 */
function isPlacementValid(left: number, top: number, width: number, height: number, excludeObject?: Rect): boolean {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  // Check if the object is out of canvas bounds
  if (left < 0 || top < 0 || left + width > canvasWidth || top + height > canvasHeight) return false;

  // Check if the object is placed in inactive or restricted areas
  const mapLayout = currentMap.layout;
  const startX = Math.floor(left / tileSize);
  const startY = Math.floor(top / tileSize);
  const endX = Math.floor((left + width - 1) / tileSize);
  const endY = Math.floor((top + height - 1) / tileSize);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (mapLayout[y]?.[x] === 'inactive' || mapLayout[y]?.[x] === 'door') return false;
    }
  }

  // Check for collisions with other objects
  const objects = canvas.getObjects().filter((obj) => obj.evented || obj.selectable);
  for (const obj of objects) {
    if (obj === excludeObject) continue;

    const objLeft = obj.left || 0;
    const objTop = obj.top || 0;
    const objWidth = Math.floor(obj.getScaledWidth() / tileSize) * tileSize;
    const objHeight = Math.floor(obj.getScaledHeight() / tileSize) * tileSize;

    if (left < objLeft + objWidth && left + width > objLeft && top < objTop + objHeight && top + height > objTop) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a grid overlay on the canvas based on the active tiles in the map layout.
 * @param layout - The 2D array representing the map layout.
 */
function createGrid(layout: string[][]) {
  layout.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile === 'active') {
        const left = x * tileSize;
        const top = y * tileSize;

        // Draw horizontal and vertical grid lines
        canvas.add(new Line([left, top, left + tileSize, top], { stroke: '#cccccc', selectable: false, evented: false }));
        canvas.add(new Line([left, top, left, top + tileSize], { stroke: '#cccccc', selectable: false, evented: false }));

        // Draw boundary lines for the last row/column of active tiles
        if (x === row.length - 1 || layout[y][x + 1] !== 'active') {
          canvas.add(new Line([left + tileSize, top, left + tileSize, top + tileSize], { stroke: '#cccccc', selectable: false, evented: false }));
        }
        if (y === layout.length - 1 || layout[y + 1]?.[x] !== 'active') {
          canvas.add(new Line([left, top + tileSize, left + tileSize, top + tileSize], { stroke: '#cccccc', selectable: false, evented: false }));
        }
      }
    });
  });
}

/**
 * Updates the canvas size to match the dimensions of the map layout.
 * @param map - The map object containing the layout.
 */
function updateCanvasSize(map: { layout: string[][] }) {
  canvas.setWidth(map.layout[0].length * tileSize);
  canvas.setHeight(map.layout.length * tileSize);
  canvas.requestRenderAll();
}

/**
 * Loads a map onto the canvas and renders its layout.
 * @param map - The map object to load.
 */
function loadMap(map: { name: string; layout: string[][] }) {
  updateCanvasSize(map);
  canvas.clear();

  map.layout.forEach((row, y) => {
    row.forEach((tile, x) => {
      const left = x * tileSize;
      const top = y * tileSize;

      if (tile === 'active') {
        canvas.add(new Rect({ left, top, width: tileSize, height: tileSize, fill: '#e0e0e0', selectable: false, evented: false }));
      } else if (tile === 'door') {
        canvas.add(new Rect({ left, top, width: tileSize, height: tileSize, fill: '#ffcc00', selectable: false, evented: false }));
      }
    });
  });

  createGrid(map.layout);
}

/**
 * Attaches event handlers to a rectangular object for movement, rotation, and validation.
 * @param rect - The rectangular object.
 * @param widthInTiles - The width of the object in tiles.
 * @param heightInTiles - The height of the object in tiles.
 */
function attachObjectHandlers(rect: Rect, widthInTiles: number, heightInTiles: number) {
  let lastValidState = { left: rect.left || 0, top: rect.top || 0, width: rect.width || 0, height: rect.height || 0 };

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.key === 'R' || event.key === 'r') && canvas.getActiveObject() === rect) {
      lastValidState = { left: rect.left || 0, top: rect.top || 0, width: rect.width || 0, height: rect.height || 0 };
      [widthInTiles, heightInTiles] = [heightInTiles, widthInTiles];
      rect.set({ width: widthInTiles * tileSize, height: heightInTiles * tileSize });
      canvas.requestRenderAll();
    }
  };

  const keydownListener = handleKeyDown.bind(this);
  window.addEventListener('keydown', keydownListener);

  rect.on('deselected', () => window.removeEventListener('keydown', keydownListener));

  rect.on('moving', () => {
    const snappedLeft = Math.round((rect.left || 0) / tileSize) * tileSize;
    const snappedTop = Math.round((rect.top || 0) / tileSize) * tileSize;
    rect.set({ left: snappedLeft, top: snappedTop });
    canvas.requestRenderAll();
  });

  rect.on('modified', () => {
    const snappedLeft = Math.round((rect.left || 0) / tileSize) * tileSize;
    const snappedTop = Math.round((rect.top || 0) / tileSize) * tileSize;

    if (!isPlacementValid(snappedLeft, snappedTop, rect.width || 0, rect.height || 0, rect)) {
      alert('Invalid placement: Collision detected or out of bounds.');
      rect.set({ ...lastValidState });
      rect.setCoords();
      canvas.discardActiveObject();
    } else {
      lastValidState = { left: rect.left || 0, top: rect.top || 0, width: rect.width || 0, height: rect.height || 0 };
    }

    canvas.requestRenderAll();
  });
}

/**
 * Enables drag-and-drop functionality for placing items on the canvas.
 */
function enableDragAndDrop() {
  document.querySelectorAll('.prop-button').forEach((item) => {
    item.addEventListener('dragstart', (e) => {
      const dragEvent = e as DragEvent;
      if (!dragEvent.dataTransfer) return;
      dragEvent.dataTransfer.setData('width', (item as HTMLElement).dataset.width || '1');
      dragEvent.dataTransfer.setData('height', (item as HTMLElement).dataset.height || '1');
    });
  });

  const canvasContainer = canvas.getElement().parentElement;
  canvasContainer?.addEventListener('dragover', (e) => e.preventDefault());

  canvasContainer?.addEventListener('drop', (e) => {
    const dragEvent = e as DragEvent;
    dragEvent.preventDefault();
    if (!dragEvent.dataTransfer) return;

    const widthInTiles = parseInt(dragEvent.dataTransfer.getData('width'), 10);
    const heightInTiles = parseInt(dragEvent.dataTransfer.getData('height'), 10);
    const rectLeft = Math.floor(dragEvent.offsetX / tileSize) * tileSize;
    const rectTop = Math.floor(dragEvent.offsetY / tileSize) * tileSize;

    if (!isPlacementValid(rectLeft, rectTop, widthInTiles * tileSize, heightInTiles * tileSize)) {
      alert('Invalid placement: Collision detected or out of bounds.');
      return;
    }

    const rect = new Rect({
      left: rectLeft,
      top: rectTop,
      width: widthInTiles * tileSize,
      height: heightInTiles * tileSize,
      fill: 'rgba(0, 128, 255, 0.3)',
      stroke: '#007bff',
      strokeWidth: 2,
      hasControls: false,
      hasBorders: true,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    attachObjectHandlers(rect, widthInTiles, heightInTiles);

    canvas.getObjects().forEach((obj) => {
      if (obj instanceof Rect) {
        const objWidthInTiles = Math.round(obj.width / tileSize);
        const objHeightInTiles = Math.round(obj.height / tileSize);
        attachObjectHandlers(obj, objWidthInTiles, objHeightInTiles);
      }
    });

    canvas.requestRenderAll();
  });
}

/**
 * Enables snapping functionality to align objects to the grid.
 */
function enableSnapping() {
  canvas.on('object:moving', (e) => {
    const target = e.target;
    if (!target) return;

    const snappedLeft = Math.round(target.left / tileSize) * tileSize;
    const snappedTop = Math.round(target.top / tileSize) * tileSize;

    if (!isPlacementValid(snappedLeft, snappedTop, target.getScaledWidth(), target.getScaledHeight())) {
      target.set({ left: snappedLeft, top: snappedTop });
    }

    canvas.requestRenderAll();
  });

  canvas.on('object:selected' as any, (e) => {
    const target = e.target as Rect;
    if (target) {
      const widthInTiles = Math.round(target.width / tileSize);
      const heightInTiles = Math.round(target.height / tileSize);
      attachObjectHandlers(target, widthInTiles, heightInTiles);
    }
  });

  canvas.on('selection:cleared', () => {
    canvas.getObjects().forEach((obj) => {
      if (obj instanceof Rect) {
        const widthInTiles = Math.round(obj.width / tileSize);
        const heightInTiles = Math.round(obj.height / tileSize);
        attachObjectHandlers(obj, widthInTiles, heightInTiles);
      }
    });
  });
}

/**
 * Creates a map selection drawer with buttons to load different maps.
 */
function createMapDrawer() {
  const drawer = document.querySelector('.maps-drawer');
  const maps = [motelMap, chineseApartmentMap, houseMap];

  maps.forEach((map) => {
    const button = document.createElement('button');
    button.classList.add('map-button');
    button.textContent = map.name;
    button.addEventListener('click', () => {
      currentMap = map;
      loadMap(currentMap);
    });
    drawer?.appendChild(button);
  });
}

/**
 * Initializes the canvas and sets up the application.
 */
function initializeCanvas() {
  createMapDrawer();
  loadMap(currentMap);
  enableDragAndDrop();
  enableSnapping();
}

initializeCanvas();