'use strict';
const base = "https://inspectme.ndev.tk/Web/?cid=";
function is_url(str) {
    const regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (regexp.test(str)) {
        return true;
    } else {
        return false;
    }
}

function randomCID(length = 19) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var i;
    var result = "";
    const isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    if (window.crypto && window.crypto.getRandomValues) {
        let values = new Uint32Array(length);
        window.crypto.getRandomValues(values);
        for (i = 0; i < length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    } else {
	if(!isOpera) alert("Your browser can't generate a secure CID");
        for (i = 0; i < length; i++) {
            result += charset[Math.floor(Math.random() * charset.length)];
        }
        return result;
    }
}

function GetStarted() {
    let url = prompt("Please enter an url (optional):");

    if (url === null) return;

    if (!url || url === "about:blank") {
        url = "none";
    } else if (!is_url(url)) {
        alert("Not an valid URL :(");
        window.location.replace("/#Help!URL-Not-Valid");
    }

    const cid = randomCID();
    prompt("Give this to someone idk: ", base + cid);
    window.location.replace(base + encodeURIComponent(cid) + "&StartURL=" + encodeURIComponent(url));
}
