
class SetOriginMode
{

    constructor(vue) {
        this.vue = vue;
        this.showBlueAxes = true;
        this.cursor = 'crosshair';
    }

    click(event) {
        this.vue.origin = this.vue.unzoomPoint([event.offsetX, event.offsetY]);
        this.vue.mode = new AddPointMode(this.vue);
    }
};

class AddPointMode
{

    constructor(vue) {
        this.vue = vue;
        this.showPointer = true;
        this.showGrid = true;
        this.canCreateNewLines = true;
    }

    click(event) {
        this.vue.currentLine.push(this.vue.unzoomPoint([event.offsetX, event.offsetY]));
    }

    doubleClick(event) {
        if (this.vue.currentLine.length > 0) {
            this.vue.currentLine.push(this.vue.currentLine[0]);
            this.vue.createNewLine();
        }
    }
};

class FitImageMode
{

    constructor(vue) {
        this.vue = vue;
        this.showGrid = true;
        this.cursor = 'move';
        this.startOrigin = this.vue.zoomed.origin;
        this.original = {
            origin: this.vue.origin,
            imageSizePercentage: this.vue.imageSizePercentage,
        };
    }

    click(event) {
        this.vue.mode = new AddPointMode(this.vue);
    }

    movePointer(event) {
        const point = [event.offsetX, event.offsetY];
        const adjust = {
            width: Math.max(point[0] / this.startOrigin[0], .2),
            height: Math.max(point[1] / this.startOrigin[1], .2),
        };
        this.vue.imageSizePercentage = {
            width: this.original.imageSizePercentage.width * adjust.width,
            height: this.original.imageSizePercentage.height * adjust.height,
        };
        this.vue.origin = [
            this.original.origin[0] * adjust.width,
            this.original.origin[1] * adjust.height,
        ];
    }

    reset(event) {
        this.vue.origin = this.original.origin;
        this.vue.imageSizePercentage = this.original.imageSizePercentage;
    }
};

module.exports = {
    AddPointMode,
    FitImageMode,
    SetOriginMode,
};
