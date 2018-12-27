<template>
    <GraphLine
        :points="points"
        :color="color"
        :curve="curve"
        :stroke-width="3"
        >
    </GraphLine>
</template>

<script>
import GraphLine from './GraphLine.vue';
import * as d3 from 'd3-shape';

export default{
    components: {GraphLine},
    props: {
        x: Number,
        y: Number,
        color: String,
        radius: {
            type: Number,
            default: 1,
        },
    },
    data() {
        return {
            curve: d3.curveNatural,
        };
    },
    computed: {
        points() {
            let points = [
                [this.x - this.radius, this.y],
                [this.x, this.y - this.radius],
                [this.x + this.radius, this.y],
                [this.x, this.y + this.radius],
            ];
            // do it twice to get a nice curve
            return points.concat(points);
        },
    },
}
</script>
