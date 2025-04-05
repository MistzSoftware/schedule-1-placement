import { Canvas } from 'fabric';

export const isPlacementValid = (
    left: number,
    top: number,
    width: number,
    height: number,
    canvas: Canvas
): boolean => {
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Check if the object is out of canvas bounds
    if (left < 0 || top < 0 || left + width > canvasWidth || top + height > canvasHeight) {
        return false;
    }

    // Check for collisions with other objects
    const objects = canvas.getObjects().filter((obj) => obj.evented || obj.selectable);
    for (const obj of objects) {
        const objLeft = obj.left || 0;
        const objTop = obj.top || 0;
        const objWidth = obj.getScaledWidth(); // Use scaled width
        const objHeight = obj.getScaledHeight(); // Use scaled height

        if (left < objLeft + objWidth && left + width > objLeft && top < objTop + objHeight && top + height > objTop) {
        return false;
        }
    }

    return true;
};
