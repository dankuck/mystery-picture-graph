import BlobReader from './BlobReader.js';

export default class FilePaster {

    constructor() {
        this.listeners = [];

        document.addEventListener('paste', (event) => {
            for (let i = 0; i < event.clipboardData.items.length; i++) {
                if (/image\//.test(event.clipboardData.items[i].type)) {
                    this.convertToJpg(event.clipboardData.items[i].getAsFile());
                    return;
                }
            }
        });
    }

    convertToJpg(blob) {
        const reader = new FileReader();
        reader.onload = (read) => {
            const str = read.target.result;
            const canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
            const context = canvas.getContext('2d');
            const img = new Image();
            img.src = "data:image/png;base64," + btoa(str);
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    this.readBlob(blob);
                    document.body.removeChild(canvas);
                }, 'image/jpeg', 11/12);
            };
        };
        reader.readAsBinaryString(blob);
    }

    readBlob(blob) {
        new BlobReader(blob).read().then(data => this.fire(data));
    }

    addHandler(closure) {
        this.listeners.push(closure);
    }

    fire(data) {
        this.listeners.map(closure => closure(data));
    }
}
