<template>
    <div :style="style" style="border: 1px solid black;">
        <svg width="100%" height="100%">
            <g>
                <template v-for="line in lines">
                    <path :d="makePath(line)" :stroke="color" :stroke-width="lineSize"></path>
                </template>
            </g>
        </svg>
    </div>
</template>

<script>
import * as d3 from 'd3-shape';
import collect from 'collect.js';
import PointTranslator from './PointTranslator.js';

export default{
    props: {
        width: Number,
        height: Number,
        interval: Number,
        color: String,
        origin: Array,
        lineSize: {
            type: Number,
            default: 1,
        },
    },
    computed: {
        style() {
            return {
                width: this.width + 'px',
                height: this.height + 'px',
            }
        },
        /**
         * Creates an array of "lines".
         * Each "line" is an array of "points".
         * Each "point" is an array with 0 and 1 elements representing x and y
         * respectively.
         *
         * @return array
         */
        lines() {
            if (this.interval < 1) {
                return [];
            }

            const translator = new PointTranslator(this.origin, this.interval);

            // Get the grid-based bottom-left corner (minimum values for x and y)
            const [minX, minY] = translator.pixelToGrid([0, this.height]);

            // Get the grid-based top-right corner (minimum values for x and y)
            const [maxX, maxY] = translator.pixelToGrid([this.width, 0]);

            // Loop over the grid coordinates and make lines in the pixel-coordinates

            // First the vertical lines...
            const verticalLines = [];
            for (let i = minX; i <= maxX; i++) {
                verticalLines.push([
                    translator.gridToPixel([i, minY - 1]),
                    translator.gridToPixel([i, maxY + 1])
                ]);
            }

            // ...then the horizontal lines
            const horizontalLines = [];
            for (let i = minY; i <= maxY; i++) {
                horizontalLines.push([
                    translator.gridToPixel([minX - 1, i]),
                    translator.gridToPixel([maxX + 1, i])
                ]);
            }

            // Return all the lines
            return []
                .concat(verticalLines)
                .concat(horizontalLines);
        },
    },
    methods: {
        makePath: d3
            .line()
            .x(coord => coord[0])
            .y(coord => coord[1]),
    },
}
</script>
