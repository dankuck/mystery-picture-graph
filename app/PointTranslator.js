
/**
 * PointTranslator
 *
 * Translates between full-resolution pixel coordinates and grid-based
 * coordinates.
 *
 * The full-resolution pixel coordinate system is based at top left and has
 * y-axis going down and x-axis going right.
 *
 * The grid coordinate system is infinite and has y-axis going up and x-axis
 * going right.
 */
export default class PointTranslator
{
    constructor(origin, interval)
    {
        this.origin = origin;
        this.interval = interval;
    }

    /**
     * Change a grid-based coordinate to a full-resolution pixel coordinate.
     */
    gridToPixel(point)
    {
        let [x, y] = point;
        x = x * this.interval + this.origin[0];
        y = this.origin[1] - y * this.interval;
        return [x, y];
    }

    /**
     * Change a full-resolution pixel coordinate to a grid-based coordinate.
     */
    pixelToGrid(point)
    {
        let [x, y] = point;
        x = Math.round((x - this.origin[0]) / this.interval);
        y = Math.round((this.origin[1] - y) / this.interval);
        return [x, y];
    }

}
