
export default class BlobReader {

    constructor(blob) {
        this.blob = blob;
    }

    read() {
        return new Promise((cb) => {
            const reader = new FileReader();
            reader.onload = (read) => {
                cb(read.target.result);
            };
            reader.readAsBinaryString(this.blob);
        });
    }
}
