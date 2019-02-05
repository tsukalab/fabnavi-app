const isDev = require('electron-is-dev');

class Host {
    constructor() {
        this.url = isDev ? 'http://fabnavi.org' : 'http://preview.fabnavi.org';
    }
    set(url) {
        this.url = url;
    }
}

window.host = new Host();
export const host = window.host;
