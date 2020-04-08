Sync = [];
const cors_proxy = "https://cors.usercontent.ndev.tk/?url=";

UpdateRate = 1000;
RaceTimeout = 2000;
Timeout = 4000;
retryTime = 300;
InputUpdateBusy = [];

html = new Map();
URLMap = new Map();
Redirect = new Map();
inputs_pages = [];

Owner = false;
old_html = "";
original = new Map();
URLHistory = new Map();
Loop = false;
dmp = new diff_match_patch();

rick_roll = () => document.documentElement.innerHTML = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
TakeOwnership = () => Owner = true;

Math.seed = s => { // Magic seed function I did not make
    var mask = 0xffffffff;
    var m_w = (123456789 + s) & mask;
    var m_z = (987654321 - s) & mask;

    Math.random = () => {
        m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
        m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;

        var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
        result /= 4294967296;
        return result;
    }
}

function status(response) {
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response)
    } else {
        return Promise.reject(new Error(response.statusText))
    }
}

function redirected(url) {
    var url;
    for (var i = 1; i <= 10; i++) {
        if (Redirect.has(url)) {
            url = Redirect.get(url);
            if (!Redirect.has(url)) return url
        } else {
            return url
        }
    }
    window.location.replace("/#Help!Redirect-Loop");
}

function ChangePage(url) { // On click link in html
    let redirected_url = redirected(url);
    AddToHistory(redirected_url);
    setURL(redirected_url);
}

if (GetParams()) { // If error
    window.location.replace("/#Help!Invalid-Parameters");
}

function SendNewChanges() { // Main function that checks the html for changes
    if (!Sync[page]) return;
    old_html = html.get(page); // Both are the same
    html.set(page, document.documentElement.innerHTML); // gets new HTML
    if (old_html != html.get(page)) {
        socket.send(JSON.stringify({
            ACTION: "SYNC",
            PAGE: page,
            DATA: dmp.patch_make(old_html, html.get(page))
        }));
    }
    return;
}

function loop_safe() { // Only run once
    if (!Loop) {
        Loop = true;
        RegisterInputs(true); // First time (Sets inputs_pages)
        setInterval(SendNewChanges, UpdateRate);
        setInterval(RegisterInputs, UpdateRate);
        register_clickevent(); // Allow user to change page from click
    }
}

function register_clickevent() {
    document.onclick = function(e) {
        e = e || window.event;
        var element = e.target || e.srcElement;
        if (element.tagName == 'A') {
            ChangePage(element.href);
            return false;
        }
    };
}

// Main webshocket used for communication between devices
socket = new WebSocket("wss://wsnoob.herokuapp.com");

socket.onopen = event => {
    socket.send(ID);
    window.addEventListener('popstate', (e) => PageState(e));
    if (page !== null) return;
    page = 0;
    inputs_pages[page] = [];
    window.history.replaceState(page, document.title);
    socket.send(JSON.stringify({ // Get reset of pages
        ACTION: "Noob"
    }));
    setTimeout(() => {
        if (!html.has(0)) OwnershipChange()
    }, Timeout);
};

socket.onerror = event => {
    window.location.replace("/#Help!Shocket-Error");
};

function OwnershipChange() {
    Race = true;
    socket.send(JSON.stringify({ // Get reset of pages
        ACTION: "RACE"
    }));
    setTimeout(() => {
        if (Race) window.location.replace("/#Help!Offline");
        socket.send(JSON.stringify({ // Change Ownership
            ACTION: "OWNER",
            BODY: NewOwner
        }));
    }, RaceTimeout);
}

function PageChecker(page) {
    if (!page) return false;
    if (!html.has(page)) {
        socket.send(JSON.stringify({
            ACTION: "GET",
            PAGE: page
        }));
        return true;
    };
    return false;
}

function PageState(event) {
    page = event.state;
    if(!URLHistory.has(page)) page = 0;
    setURL(URLHistory.get(page));
}


async function InputUpdate(Index) { // Gets run on event "input" foreach input   
    if (!Sync[page]) return
    while (InputUpdateBusy[Index]) await sleep(retryTime);
    InputUpdateBusy[Index] = true;
    var current = inputs[Index].value;
    if (!inputs_pages[page].hasOwnProperty(Index) || inputs_pages[page][Index] === current) {
        return InputUpdateBusy[Index] = false;
    }
    var previous = inputs_pages[page][Index];
    socket.send(JSON.stringify({ // Send value changes
        ACTION: "InputChanges",
        INDEX: Index,
        PAGE: page,
        Patch: dmp.patch_make(previous, current)
    }))
    inputs_pages[page][Index] = current; // Update inputs_pages with new content
    InputUpdateBusy[Index] = false;
}

function RegisterInputs(firstTime) {
    inputs = document.querySelectorAll('input');
    for (let Index = 0; Index < inputs.length; Index++) {
        if (inputs[Index].hasAttribute("value")) {
            inputs[Index].addEventListener('input', () => InputUpdate(Index));
            if (firstTime) {
                inputs_pages[page][Index] = inputs[Index].value;
            }
        }
    }
}


async function SetInputs(InputsPage) {
    if(!inputs_pages.hasOwnProperty(InputsPage)) return
    var Values = inputs_pages[InputsPage];
    if (InputsPage !== page) return
    while(ApplyInputChangesBusy[InputsPage] || ApplyChangesBusy[InputsPage]) await sleep(retryTime);
    inputs = document.querySelectorAll('input');
    Values.forEach((item, index) => { // Foreach item check if has index and set new value if true
        if (inputs.hasOwnProperty(index) && inputs[index].hasAttribute("value")) inputs[index].value = item;
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

ApplyInputChangesBusy = [];

async function ApplyInputChanges(index, Patch, PAGE) { // Apply patch to HTML
    while (ApplyInputChangesBusy[Patch.PAGE]) await sleep(retryTime);
    return ApplyInputChanges_Action(index, Patch, PAGE);
}

function ApplyInputChanges_Action(index, Patch, PAGE) { // Apply Patch to input value
    ApplyInputChangesBusy[page] = true;
    if (!Sync[PAGE]) return
    inputs_pages[PAGE][index] = dmp.patch_apply(Patch, inputs_pages[PAGE][index])[0];
    if(page === PAGE) inputs[index].value = inputs_pages[PAGE][index];
    ApplyInputChangesBusy[page] = false;
}

function sha512(str) {
  return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str)).then(buf => {
    return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
  });
}

socket.addEventListener('message', async event => { // OnMessage
    if (!isJSON(event.data)) return
    var message = JSON.parse(event.data);
    if (message.ACTION !== "DOWNLOAD" && message.ACTION !== "DOWNLOAD_full" && PageChecker(message.PAGE)) return;
    if (html.has(message.PAGE)) {
        switch (message.ACTION) {
            case "GET":
                if (!Owner) break;
                var checksum = await sha512(original.get(message.PAGE));
                socket.send(JSON.stringify({
                    ACTION: "DOWNLOAD",
                    PAGE: message.PAGE,
                    HASH: checksum,
                    URL: URLHistory.get(page),
                    Patch: dmp.patch_make(original.get(page), html.get(page))
                }));
                break;
            case "GET_full":
                socket.send(JSON.stringify({
                    ACTION: "DOWNLOAD_full",
                    PAGE: message.PAGE,
                    URL: URLHistory.get(message.PAGE),
                    BODY: html.get(message.PAGE)
                }));
                break;
            case "SYNC":
                ApplyChanges(message);
                break;
            case "InputChanges": // Input value changes received
                ApplyInputChanges(message.INDEX, message.Patch, message.PAGE);
                break;
            case "setURL":
                Sync[message.PAGE] = false;
                setURL(message.URL); // Sync URL
                break;
        }
    } else {
        switch (message.ACTION) {
            case "NoobInfo":
                if (html.has(0)) return;
                URLMap = new Map(message.URLMap);
                Redirect = new Map(message.Redirect);
                inputs_pages = message.inputs_pages;
                URLMap.forEach(key => {
                    if (html.has(key)) return;
                    socket.send(JSON.stringify({
                        ACTION: "GET",
                        PAGE: key
                    }));
                });
                break;
            case "Noob":
                if (!Owner) return;
                if (html.size < 1) return;
                socket.send(JSON.stringify({
                    ACTION: "NoobInfo",
                    URLMap: Array.from(URLMap),
                    Redirect: Array.from(Redirect),
                    inputs_pages: inputs_pages
                }));
                break;
            case "DOWNLOAD":
                setURL(message.URL, message.PAGE, message.Patch, message.HASH); // Set current URL to value in Patch
                break;
            case "DOWNLOAD_full":
                html.set(message.PAGE, message.BODY);
                URLMap.set(message.URL, message.PAGE);
                original.set(message.PAGE, message.BODY);
                var ActiveTab = (message.PAGE === page);
                if(ActiveTab) CheckLocal(ActiveTab, message.URL);           
                break;
                
            case "REDIRECT":
                setRedirect(message.OLD, message.NEW, false); // Set current URL to value in Patch
                break;

            case "RACE":
                NewOwner = Math.random();
                socket.send(JSON.stringify({ // Get reset of pages
                    ACTION: "RACE_REPLY",
                    BODY: NewOwner
                }));
                break;
            case "RACE_REPLY":
                if (!Race) break;
                Race = false;
                NewOwner = message.BODY;
                break;
            case "OWNER":
                if (NewOwner == message.BODY) TakeOwnership();
                break;
        }
    }
});

ApplyChangesBusy = [];

async function ApplyChanges(Patch) { // Apply patch to HTML
    while(ApplyChangesBusy[Patch.PAGE]) await sleep(300);
    ApplyChanges_Action(Patch);
}


function ApplyChanges_Action(Patch) { // Apply patch to HTML
    ApplyChangesBusy[Patch.PAGE] = true;
    html.set(Patch.PAGE, dmp.patch_apply(Patch.DATA, html.get(Patch.PAGE))[0]);
    if (Patch.PAGE == page) { // If Patch is for current page
        document.documentElement.innerHTML = html.get(page);
        SetInputs(page);
    }
    ApplyChangesBusy[Patch.PAGE] = false;
}

function addhttps(url) { // Auto add https for setURL
    var url;
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "https://".concat(url);
    }
    return url;
}

function Blank(url) {
    html.set(page, "");
    original.set(page, html.get(page)); // Base HTML for the patch. (used for GET)
    if(inputs_pages.hasOwnProperty(page)) SetInputs(page);
    old_html = document.documentElement.innerHTML;
    current_url = url;
    Sync[page] = true; // Enable Sync
    loop_safe(); // Start Main loops
    return
}

function AddToHistory(url) {
    page = (URLMap.has(url)) ? URLMap.get(url) : html.size;
    if(!inputs_pages.hasOwnProperty(page) || !URLMap.has(url)) inputs_pages[page] = [];
    URLHistory.set(page, url);
    window.history.pushState(page, document.title); // Push to history
}

function ParseURL(url) {
    try {
        return new URL(url); // gets origin after redirect/s
    } catch (err) {
        alert("Unable to parse URL  :(");
        window.location.replace("/#Help!Unable-To-Parse-URL");
    }
}

function setRedirect(url, redirected_url, broadcast = true) {
    if(url !== redirected_url) {
        if(broadcast && socket.readyState === 1) {
            socket.send(JSON.stringify({
                ACTION: "REDIRECT",
                OLD: url,
                NEW: redirected_url
            }));
        }
        Redirect.set(url, redirected_url);
    }
}

function ContentCorrupt(p, url) {
    socket.send(JSON.stringify({
        ACTION: "GET_full",
        PAGE: p,
        URL: url
    }));
}

function setURL(url, SETURL_PAGE = page, Patch, checksum = false) {
    var url = redirected(url);
    var url = addhttps(url);
    var ActivePage = (SETURL_PAGE === page);
    var ReplyURL;
    var response;
    Sync[SETURL_PAGE] = false;
    if (url == "https://about:blank") {
        Blank();
        return
    }
    if (ActivePage) {
        document.documentElement.innerHTML = "<h1>Loading URL...</h1>";
    }
    if(CheckLocal(ActivePage, url)) return
    fetch(cors_proxy + encodeURI(url)).then(status).catch(error => {
        window.location.replace("/#Help!Unable-To-Download-Website"); // :(
    }).then(response => {
        ReplyURL = ParseURL(response.headers.get('X-Final-URL'));
        if(ReplyURL !== url) setRedirect(url, ReplyURL.href);
        if(ActivePage) URLHistory.set(SETURL_PAGE, ReplyURL.href);
        return response.text();
    }).then(async (response) => {
        response = "<base href='" + ReplyURL.origin + "/' />" + response;
        if(checksum && await sha512(response) !== checksum) {
            return ContentCorrupt(SETURL_PAGE, url);
        }
        if (Patch !== undefined && Patch.length != 0) response = dmp.patch_apply(Patch, response)[0];
        if (ActivePage) {
            document.documentElement.innerHTML = response;
            current_url = ReplyURL.href;
        }
        original.set(SETURL_PAGE, response); // Base HTML for the patch. (used for GET)
        html.set(SETURL_PAGE, response);
        URLMap.set(ReplyURL.href, SETURL_PAGE);
        loop_safe(); // Start Main loops
        Sync[SETURL_PAGE] = true;
    });
}

function CheckLocal(ActivePage, url) {
    if(URLMap.has(url) && ActivePage && page === URLMap.get(url) && html.has(page)) {
        document.documentElement.innerHTML = html.get(page);
        loop_safe(); // Start Main loops
        current_url = url;
        if(inputs_pages.hasOwnProperty(page)) SetInputs(page);
        URLHistory.set(page, url);
        Sync[page] = true;
        return true;
    }
    return false;
}

function GetParams() {
    URI = new URL(location.href);

    if (URI.searchParams.has("cid") && URI.searchParams.get("cid") !== "") {
        ID = encodeURI(URI.searchParams.get("cid"));
        Math.seed(ID);
    } else {
        return true
    }

    if (URI.searchParams.has("page")) {
        page = URI.searchParams.get("page")
        if (isNaN(page)) page = null; // No pages yet
    } else {
        page = null;
    }

    if (URI.searchParams.has("StartURL")) {
        page = 0;
        inputs_pages[page] = [];
        TakeOwnership();
        StartURL = URI.searchParams.get("StartURL");
        if (StartURL == "none") {
            StartURL = "about:blank";
        } else {
            StartURL = addhttps(StartURL);
        }
        CleanURI(URI, page);
        setURL(StartURL);
    }
}

function CleanURI(URI, index = 0) {
    if (!history.pushState) return;
    URI.searchParams.delete("StartURL"); // Removes StartURL from the URL
    window.history.replaceState(index, document.title, URI.toString());
}

function isJSON(str) { // Attempt to parse JSON
    try {
        return (JSON.parse(str) && !!str);
    } catch (e) {
        return false;
    }
}
