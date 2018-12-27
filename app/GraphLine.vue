<template>
    <div style="width: 100%; height: 100%">
        <svg width="100%" height="100%">
            <g>
                <path :d="makePath(points)" :stroke="color" :stroke-width="this.strokeWidth" fill="none"></path>
            </g>
        </svg>
    </div>
</template>

<script>
import * as d3 from 'd3-shape';

export default{
    props: {
        points: Array,
        color: String,
        curve: {
            type: Function,
            default: d3.curveLinear,
        },
        strokeWidth: {
            type: Number,
            default: 1,
        },
    },
    computed: {
        makePath() {
            return d3
                .line()
                .curve(this.curve)
                .x(coord => coord[0])
                .y(coord => coord[1]);
        },
    },
}
</script>
