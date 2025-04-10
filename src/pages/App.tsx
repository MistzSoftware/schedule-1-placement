import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import '../styles/App.css'; // Updated CSS import path
import { Canvas, Rect, Line, Textbox } from 'fabric'; // Replace Text with Textbox
import React from 'react';
import MapDrawer from '../components/MapDrawer';

const tileSize = 25; // Size of each grid tile in pixels

function App() {
    const canvasRef = useRef<Canvas | null>(null);
    const [map, setMap] = useState<{ ground: number; floors: { name: string; layout: (string | string[])[] }[] } | null>(null);
    const [isDeletionMode, setIsDeletionMode] = useState(false);
    const [floorIndex, setFloorIndex] = useState(0);

    const toggleDeletionMode = () => {
        setIsDeletionMode((prev) => !prev);
    };

    const enableDeletionMode = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        canvas.on('mouse:down', (e) => {
            if (!isDeletionMode || !e.target) return;

            // Remove the clicked object
            canvas.remove(e.target);
            canvas.requestRenderAll();
        });
    };

    useEffect(() => {
        if (isDeletionMode) {
            enableDeletionMode();
        } else {
            if (canvasRef.current) {
                canvasRef.current.off('mouse:down');
            }
        }
    }, [isDeletionMode]);

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Backspace' && canvasRef.current) {
            const canvas = canvasRef.current;
            const activeObject = canvas.getActiveObject();

            if (activeObject) {
                canvas.remove(activeObject);
                canvas.discardActiveObject();
                canvas.requestRenderAll();
            }
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!canvasRef.current) {
            canvasRef.current = new Canvas('canvas', {
                width: 10 * tileSize,
                height: 13 * tileSize,
                backgroundColor: '#f0f0f0',
                selection: false,
            });

            displayDefaultMessage();
        }
    }, []);

    useEffect(() => {
        if (map) {
            enableDragAndDrop();
            enableSnapping();
        }
    }, [map]);

    const displayDefaultMessage = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        canvas.clear();
        const text = new Textbox('Select a property to visualize', {
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: 'center',
            originY: 'center',
            fontSize: 20,
            fill: '#888',
            selectable: false,
            evented: false,
            width: canvas.getWidth(),
            textAlign: 'center',
        });
        canvas.add(text);
    };

    const loadMap = (newMap: { ground: number; floors: { name: string; layout: (string | string[])[] }[] }) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;

        // Dispose of the existing canvas instance
        canvas.dispose();

        // Reinitialize the canvas
        canvasRef.current = new Canvas('canvas', {
            width: 10 * tileSize,
            height: 13 * tileSize,
            selection: false,
        });

        setMap(newMap);
        setFloorIndex(newMap.ground);

        if (!newMap.floors || newMap.floors.length === 0 || !newMap.floors[0].layout) {
            toast.error('Invalid map floors');
            const text = new Textbox('ERROR: Unable to load layout.', {
                left: canvas.getWidth() / 2,
                top: canvas.getHeight() / 2,
                originX: 'center',
                originY: 'center',
                fontSize: 20,
                fill: '#888',
                selectable: false,
                evented: false,
                width: canvas.getWidth(),
                textAlign: 'center',
            });
            canvas.add(text);
            return;
        }

        renderFloor(newMap.floors[newMap.ground].layout);
    };

    const showNextFloor = () => {
        if (!map || !map.floors) return;

        if (floorIndex + 1 >= map.floors.length) {
            toast.error('No next floor available.');
            return;
        }

        const nextFloorIndex = floorIndex + 1;
        setFloorIndex(nextFloorIndex);

        const nextFloorLayout = map.floors[nextFloorIndex].layout;
        renderFloor(nextFloorLayout);
    };

    const showPreviousFloor = () => {
        if (!map || !map.floors) return;

        if (floorIndex - 1 < 0) {
            toast.error('No previous floor available.');
            return;
        }

        const previousFloorIndex = floorIndex - 1;
        setFloorIndex(previousFloorIndex);

        const previousFloorLayout = map.floors[previousFloorIndex].layout;
        renderFloor(previousFloorLayout);
    };

    const renderFloor = (floorLayout: (string | string[])[]) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        // Clear the canvas before rendering the new floor
        canvas.clear();

        // Validate and transform floorLayout to ensure all rows are arrays
        const transformedLayout = floorLayout.map((row, rowIndex) => {
            if (Array.isArray(row)) {
                return row;
            } else if (typeof row === 'string') {
                console.warn(`Row at index ${rowIndex} is a string. Wrapping it in an array.`);
                return [row]; // Wrap single string rows in an array
            } else {
                console.error(`Invalid row at index ${rowIndex}. Expected an array or string, but got:`, row);
                throw new Error(`Invalid row at index ${rowIndex}.`);
            }
        });

        // Ensure all rows have the same number of columns
        const maxColumns = Math.max(...transformedLayout.map(row => row.length));
        const normalizedLayout = transformedLayout.map(row => {
            if (row.length < maxColumns) {
                return [...row, ...Array(maxColumns - row.length).fill('')]; // Fill missing columns with empty strings
            }
            return row;
        });

        // Update canvas size to match the layout dimensions
        const canvasWidth = maxColumns * tileSize;
        const canvasHeight = normalizedLayout.length * tileSize;
        canvas.setWidth(canvasWidth);
        canvas.setHeight(canvasHeight);

        // Render the normalized layout
        normalizedLayout.forEach((row, y) => {
            row.forEach((tile, x) => {
                const left = x * tileSize;
                const top = y * tileSize;

                if (tile === 'active') {
                    canvas.add(
                        new Rect({
                            left,
                            top,
                            width: tileSize,
                            height: tileSize,
                            fill: '#e0e0e0',
                            selectable: false,
                            evented: false,
                        })
                    );
                } else if (tile === 'door') {
                    canvas.add(
                        new Rect({
                            left,
                            top,
                            width: tileSize,
                            height: tileSize,
                            fill: '#ffcc00',
                            selectable: false,
                            evented: false,
                        })
                    );
                } else if (tile === 'stair') {
                    canvas.add(
                        new Rect({
                            left,
                            top,
                            width: tileSize,
                            height: tileSize,
                            fill: '#00ccff',
                            selectable: false,
                            evented: false,
                        })
                    );
                } else {
                    // Render empty tiles for unrecognized or empty values
                    canvas.add(
                        new Rect({
                            left,
                            top,
                            width: tileSize,
                            height: tileSize,
                            fill: '#ffffff',
                            stroke: '#cccccc',
                            selectable: false,
                            evented: false,
                        })
                    );
                }
            });
        });

        // Draw grid lines for better visualization
        createGrid(normalizedLayout);

        canvas.requestRenderAll();
    };

    /**
     * Attaches event handlers to a rectangular object for movement, rotation, and validation.
     * @param rect - The rectangular object.
     * @param widthInTiles - The width of the object in tiles.
     * @param heightInTiles - The height of the object in tiles.
     */
    function attachObjectHandlers(rect: Rect, widthInTiles: number, heightInTiles: number) {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        let lastValidState = {
            left: rect.left || 0,
            top: rect.top || 0,
            width: rect.width || 0,
            height: rect.height || 0,
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.key === 'R' || event.key === 'r') && canvas.getActiveObject() === rect) {
                // Save the last valid state before rotation
                lastValidState = {
                    left: rect.left || 0,
                    top: rect.top || 0,
                    width: rect.width || 0,
                    height: rect.height || 0,
                };

                // Swap width and height for rotation
                [widthInTiles, heightInTiles] = [heightInTiles, widthInTiles];
                rect.set({
                    width: widthInTiles * tileSize,
                    height: heightInTiles * tileSize,
                });

                // Snap to grid after rotation
                rect.set({
                    left: Math.round((rect.left || 0) / tileSize) * tileSize,
                    top: Math.round((rect.top || 0) / tileSize) * tileSize,
                });

                rect.setCoords();
                canvas.requestRenderAll();
            }
        };

        const keydownListener = handleKeyDown;

        const attachKeydownListener = () => {
            window.addEventListener('keydown', keydownListener);
        };

        const detachKeydownListener = () => {
            window.removeEventListener('keydown', keydownListener);
        };

        // Attach the keydown listener initially
        attachKeydownListener();

        rect.on('deselected', () => {
            // Remove the keydown listener when the object is deselected
            detachKeydownListener();
        });

        rect.on('selected', () => {
            // Reattach the keydown listener when the object is selected again
            attachKeydownListener();
        });

        rect.on('moving', () => {
            // Snap the object to the grid while moving
            const snappedLeft = Math.round((rect.left || 0) / tileSize) * tileSize;
            const snappedTop = Math.round((rect.top || 0) / tileSize) * tileSize;
            rect.set({ left: snappedLeft, top: snappedTop });
            canvas.requestRenderAll();
        });

        rect.on('modified', () => {
            // Validate the placement after modification
            const snappedLeft = Math.round((rect.left || 0) / tileSize) * tileSize;
            const snappedTop = Math.round((rect.top || 0) / tileSize) * tileSize;

            if (!isPlacementValid(snappedLeft, snappedTop, rect.width || 0, rect.height || 0, rect)) {
                rect.set({ ...lastValidState });
                rect.setCoords();
                canvas.discardActiveObject();
            } else {
                // Save the new valid state
                lastValidState = {
                    left: rect.left || 0,
                    top: rect.top || 0,
                    width: rect.width || 0,
                    height: rect.height || 0,
                };

                // Reattach the keydown listener to ensure rotation works
                attachKeydownListener();
            }

            canvas.requestRenderAll();
        });
    }

    const updateCanvasSize = (map: { layout: string[][] }) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        canvas.setWidth(map.layout[0].length * tileSize);
        canvas.setHeight(map.layout.length * tileSize);
        canvas.requestRenderAll();
    };

    const createGrid = (layout: string[][]) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        layout.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 'active') {
                    const left = x * tileSize;
                    const top = y * tileSize;

                    // Draw horizontal and vertical grid lines
                    canvas.add(
                        new Line([left, top, left + tileSize, top], {
                            stroke: '#cccccc',
                            selectable: false,
                            evented: false,
                        })
                    );
                    canvas.add(
                        new Line([left, top, left, top + tileSize], {
                            stroke: '#cccccc',
                            selectable: false,
                            evented: false,
                        })
                    );

                    // Draw boundary lines for the last row/column of active tiles
                    if (x === row.length - 1 || layout[y][x + 1] !== 'active') {
                        canvas.add(
                            new Line([left + tileSize, top, left + tileSize, top + tileSize], {
                                stroke: '#cccccc',
                                selectable: false,
                                evented: false,
                            })
                        );
                    }
                    if (y === layout.length - 1 || layout[y + 1]?.[x] !== 'active') {
                        canvas.add(
                            new Line([left, top + tileSize, left + tileSize, top + tileSize], {
                                stroke: '#cccccc',
                                selectable: false,
                                evented: false,
                            })
                        );
                    }
                }
            });
        });
    };

    const enableDragAndDrop = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

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

            if (!isPlacementValid(rectLeft, rectTop, widthInTiles * tileSize, heightInTiles * tileSize)) return;

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
    };

    const enableSnapping = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        canvas.on('object:moving', (e) => {
            const target = e.target;
            if (!target) return;

            const snappedLeft = Math.round(target.left / tileSize) * tileSize;
            const snappedTop = Math.round(target.top / tileSize) * tileSize;

            target.set({ left: snappedLeft, top: snappedTop });
            canvas.requestRenderAll();
        });
    };

    const isPlacementValid = (left: number, top: number, width: number, height: number, excludeObject?: Rect): boolean => {
        if (!canvasRef.current) return false;

        const canvas = canvasRef.current;
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();

        // Check if the object is out of canvas bounds
        if (left < 0 || top < 0 || left + width > canvasWidth || top + height > canvasHeight) {
            toast.error('Invalid placement: Out of bounds.');
            return false;
        }

        // Check if the object is placed in inactive or restricted areas
        const startX = Math.floor(left / tileSize);
        const startY = Math.floor(top / tileSize);
        const endX = Math.floor((left + width - 1) / tileSize);
        const endY = Math.floor((top + height - 1) / tileSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (map && typeof map.floors[floorIndex].layout[y]?.[x] === 'string' && (map.floors[floorIndex].layout[y][x] === 'inactive' || map.floors[floorIndex].layout[y][x] === 'door')) {
                    toast.error('Invalid placement: Collision with restricted area.');
                    return false;
                }
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
                toast.error('Invalid placement: Collision with another object.');
                return false;
            }
        }

        return true;
    };

    const removeAllProps = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        // Remove all objects except the grid
        canvas.getObjects().forEach((obj) => {
            if (obj.evented || obj.selectable) {
                canvas.remove(obj);
            }
        });

        canvas.requestRenderAll();
    };

    return (
        <div className="main-container">
            <MapDrawer onMapChange={loadMap} />
            <div className="canvas-container">
                <canvas id="canvas"></canvas>
            </div>
            <div className="drawer items-drawer">
                <h2>Items</h2>
                <div className="prop-button" data-width="1" data-height="1" draggable="true">
                    Debug Tool
                </div>
                <div className="prop-button" data-width="2" data-height="1" draggable="true">
                    Sprinkler
                </div>
                <div className="prop-button" data-width="1" data-height="2" draggable="true">
                    Soil Dispenser
                </div>
                <button onClick={removeAllProps} className="remove-props-button">
                    Remove All Props
                </button>
                <button onClick={toggleDeletionMode} className={`deletion-mode-button ${isDeletionMode ? 'active' : ''}`}>
                    {isDeletionMode ? 'Disable Deletion Mode' : 'Enable Deletion Mode'}
                </button>
                <button onClick={showNextFloor}>
                    Next Floor
                </button>
                <div>
                    <p>
                        {map ? map.floors[floorIndex]?.name || 'Unknown Floor' : 'No Floor Loaded'}
                    </p>
                </div>
                <button onClick={showPreviousFloor}>
                    Previous Floor
                </button>
            </div>
        </div>
    );
}

export default App;