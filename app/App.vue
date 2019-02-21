<template>
    <div
        @keyup.esc="resetMode"
        >
        <div class="row">

            <div class="col-3 form-group">
                <div class="input-group mb-3">
                  <div class="custom-file">
                    <input type="file" @change="openFile" class="custom-file-input" id="file-input">
                    <label class="custom-file-label" for="file-input" aria-describedby="inputGroupFileAddon02"><i class="fas fa-folder-open"></i> Trace Image</label>
                  </div>
                </div>

                <div class="sticky-top" style="padding-top: .5em;">
                    <button @click="startSetOrigin" class="btn btn-primary btn-lg btn-block">Set Origin</button>

                    <button @click="createNewLine" :disabled="!mode.canCreateNewLines" class="btn btn-primary btn-lg btn-block">Start New Line</button>

                    <button @click.stop="startFitImage" :disabled="!imageSource" class="btn btn-primary btn-lg btn-block">Fit Image</button>

                    <div style="margin: 1em 0;">
                        <a href="http://www.dankuck.com/2019/02/22/mystery-picture-graph.html">What do I do?</a>
                    </div>
                </div>
            </div>

            <div class="col-9">
                <div class="row">
                    <div class="col-3">
                        <div class="custom-control custom-switch">
                          <input type="checkbox" class="custom-control-input" id="show-image" v-model="showImage" :disabled="!imageSource">
                          <label class="custom-control-label" for="show-image">Show Image</label>
                        </div>
                    </div>
                    <div class="col-9">
                        <input v-model.number="zoom" type="range" aria-label="Stretch Height" class="custom-range" min="0.20" max="10.00" step="0.01">
                    </div>
                </div>
                <div>
                    <div
                        style="position: relative; margin-bottom: 1em;"
                        :style="graphStyle"
                        @click="click"
                        @dblclick.stop="doubleClick"
                        @mousemove="movePointer"
                        @mouseout="hidePointer"
                    >
                        <img
                            v-if="imageSource"
                            v-show="showImage"
                            :src="imageSource"
                            style="position: absolute"
                            :style="imageStyle"
                            ref="theImage"
                            @load="imageLoaded"
                        />
                        <Graph
                            v-if="mode.showGrid"
                            :width="zoomed.graph.width"
                            :height="zoomed.graph.height"
                            :interval="zoomed.blockSize"
                            :origin="zoomed.origin"
                            color="grey"
                            style="position: absolute"
                            >
                        </Graph>
                        <Graph
                            v-if="mode.showBlueAxes"
                            :width="zoomed.graph.width"
                            :height="zoomed.graph.height"
                            :interval="zoomed.graph.width + zoomed.graph.height"
                            :origin="zoomed.pointer"
                            color="blue"
                            style="position: absolute"
                            >
                        </Graph>
                        <Graph
                            v-else
                            :width="zoomed.graph.width"
                            :height="zoomed.graph.height"
                            :interval="zoomed.graph.width + zoomed.graph.height"
                            :origin="zoomed.origin"
                            color="black"
                            :line-size="3"
                            style="position: absolute"
                            >
                        </Graph>
                        <GraphLine
                            v-for="(line, index) in gridLockedLinesPlusPointer"
                            :key="index"
                            :points="line"
                            color="blue"
                            style="position: absolute"
                            :stroke-width="3"
                            >
                        </GraphLine>
                        <GraphPoint
                            v-if="showPointer"
                            :x="zoomed.pointer[0]"
                            :y="zoomed.pointer[1]"
                            color="blue"
                            style="position: absolute"
                            >
                        </GraphPoint>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="alert alert-dark">
                    {{ pointsCount }} points |
                    X: {{ pathDimensions.minX }} ↔ {{ pathDimensions.maxX }} |
                    Y: {{ pathDimensions.minY }} ↔ {{ pathDimensions.maxY }}
                </div>
                <div>
                    <textarea v-model.lazy="pointsText" style="width: 100%; height: 10.5em;">
                    </textarea>
                    <div v-if="parseError">
                        Error in text: {{ parseError }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import BlobReader from './BlobReader.js';
import collect from 'collect.js';
import FilePaster from './FilePaster.js';
import Graph from './Graph.vue';
import GraphLine from './GraphLine.vue';
import GraphPoint from './GraphPoint.vue';
import Interpretter from './Interpretter.js';
import PointTranslator from './PointTranslator.js';
import LineSimplifier from './LineSimplifier.js';
import {
    AddPointMode,
    FitImageMode,
    SetOriginMode,
} from './InteractionModes.js';

const interpretter = new Interpretter();
const simplifier = new LineSimplifier();

export default {
    components: {
        Graph,
        GraphLine,
        GraphPoint,
    },
    data() {
        return {
            imageSource: null,
            pointer: [0, 0],
            pointerHidden: true,
            lines: [[]],
            origin: [200, 200],
            mode: new AddPointMode(this),
            blockSize: 10,
            showImage: true,
            imageSize: {
                width: 400,
                height: 400,
            },
            imageSizePercentage: {
                width: 1,
                height: 1,
            },
            loadingImage: false,
            parseError: null,
            zoom: 1,
            movedRecentlyToken: null,
        };
    },
    mounted() {
        this.$nextTick(() => {
            new FilePaster().addHandler(data => this.changeImageSource(data));
        });
    },
    computed: {
        zoomed() {
            return {
                graph: {
                    width: this.imageSize.width * this.imageSizePercentage.width * this.zoom,
                    height: this.imageSize.height * this.imageSizePercentage.height * this.zoom,
                },
                origin: this.zoomPoint(this.origin),
                blockSize: this.blockSize * this.zoom,
                pointer: this.zoomPoint(this.pointer),
            };
        },
        translator() {
            return new PointTranslator(this.origin, this.blockSize);
        },
        pointsText: {
            get() {
                return interpretter.linesToText(this.linesOnGrid);
            },
            set(text) {
                try {
                    const lines = interpretter.textToLines(text);
                    this.lines = lines
                        .map(line => line
                            .map(point => this.translator.gridToPixel(point))
                        );
                    if (this.lines.length === 0) {
                        this.lines = [[]];
                    }
                    this.parseError = null;
                } catch (e) {
                    this.parseError = e.toString();
                }
            },
        },
        pointsCount() {
            return this.linesOnGrid
                .reduce((count, line) => count + line.length, 0);
        },
        pathDimensions() {
            let maxX = 0,
                minX = 0,
                maxY = 0,
                minY = 0;
            this.linesOnGrid.forEach(line => {
                line.forEach(point => {
                    if (point[0] < minX) {
                        minX = point[0];
                    }
                    if (point[0] > maxX) {
                        maxX = point[0];
                    }
                    if (point[1] < minY) {
                        minY = point[1];
                    }
                    if (point[1] > maxY) {
                        maxY = point[1];
                    }
                });
            });
            return {
                maxX,
                minX,
                maxY,
                minY,
            };
        },
        graphStyle() {
            return {
                width: this.zoomed.graph.width + 'px',
                height: this.zoomed.graph.height + 'px',
                cursor: this.mode.cursor || 'default',
            };
        },
        imageStyle() {
            if (this.loadingImage) {
                return {};
            }
            return {
                width: this.zoomed.graph.width + 'px',
                height: this.zoomed.graph.height + 'px',
            };
        },
        showPointer() {
            return !this.pointerHidden && this.mode.showPointer;
        },
        currentLine() {
            return this.lines[this.lines.length - 1];
        },
        gridLockedLinesPlusPointer() {
            const lines = this.lines
                .map(line => {
                    return this.gridLockLine(line);
                });
            if (this.showPointer) {
                const lastLine = lines[lines.length - 1];
                lastLine.push(this.zoomPoint(this.pointer));
            }
            return lines;
        },
        linesOnGrid() {
            return this.lines.map(
                line => simplifier.simplify(line.map(
                    point => this.translator.pixelToGrid(point)
                ))
            );
        },
    },
    methods: {
        click(event) {
            this.mode.click && this.mode.click(event);
        },
        doubleClick(event) {
            this.mode.doubleClick && this.mode.doubleClick(event);
        },
        startSetOrigin() {
            this.mode = new SetOriginMode(this);
        },
        startFitImage() {
            this.mode = new FitImageMode(this);
        },
        resetMode(event) {
            this.mode.reset && this.mode.reset(event);
            this.mode = new AddPointMode(this);
        },
        movePointer(event) {
            this.pointer = this.unzoomPoint([event.offsetX, event.offsetY]);
            this.pointerHidden = false;
            this.mode.movePointer && this.mode.movePointer(event);
            this.movedRecentlyToken = Math.random();
        },
        hidePointer() {
            /**
             * Due to some weird browser effects, we get a lot of hidePointer
             * calls even when the mouse does not exit the graph element. To
             * solve this, the movePointer code above sets a random token. If
             * it doesn't change within a timelimit, we can tell that the
             * mouse really exited.
             */
            const movedRecentlyToken = this.movedRecentlyToken;
            setTimeout(() => {
                if (movedRecentlyToken == this.movedRecentlyToken) {
                    this.pointerHidden = true;
                }
            }, 100);
        },
        openFile(event) {
            // give things a chance to clean up before reading in the files
            this.$nextTick(() => {
                new BlobReader(event.target.files[0]).read().then(data => this.changeImageSource(data));
            });
        },
        changeImageSource(data) {
            this.lines = [[]];
            this.showImage = true;
            this.imageSizePercentage = {
                width: 1,
                height: 1,
            };
            this.loadingImage = true;
            this.$nextTick(() => {
                const imageSource = "data:image/jpg;base64," + btoa(data);
                if (this.imageSource === imageSource) {
                    // If the same image is pasted/opened again, then we can't
                    // depend on the @loaded event, so just go do the loading
                    // stuff.
                    this.imageLoaded();
                } else {
                    this.imageSource = imageSource;
                }
            });
        },


        /**
         * Bring points in line with the grid by converting them to grid
         * (which rounds them) and then back again
         */
        gridLockLine(line) {
            return line
                .map(point => this.translator.pixelToGrid(point))
                .map(point => this.zoomPoint(this.translator.gridToPixel(point)));
        },
        createNewLine() {
            if (this.currentLine.length === 0) {
                return; // no point to adding a new one
            }
            this.lines.push([]);
        },
        imageLoaded() {
            this.loadingImage = false;
            const rect = this.$refs.theImage.getBoundingClientRect();
            this.imageSize.width = rect.width;
            this.imageSize.height = rect.height;
            this.origin = [
                this.imageSize.width / 2,
                this.imageSize.height / 2,
            ];
        },
        zoomPoint(point) {
            return [point[0] * this.zoom, point[1] * this.zoom];
        },
        unzoomPoint(point) {
            return [point[0] / this.zoom, point[1] / this.zoom];
        },
    },
}
</script>
