var Sync = true;
var MSG_ALLOWED = false;
var cors_proxy = "https://cors.io/?";

var ID;
var CONTENT = [];
var URI;
var reply;
var page;
var html;
var Loop = false;
var old_html;
var dmp = new diff_match_patch();
var is_error = false;
var UpdateRate = 1000;

if (GetParams()) {
	window.location.replace("/#Help!Invalid-Parameters");
}

function SendNewChanges() {
	old_html = html; // Both are the same
    html = document.documentElement.innerHTML; // gets new HTML
    if (old_html != html && MSG_ALLOWED) {
        socket.send(JSON.stringify({
            ACTION: "SYNC",
            PAGE: page,
            DATA: dmp.patch_make(old_html, html)
        }));
    }
    return;
}

var socket = new WebSocket("wss://node2.wsninja.io");

socket.addEventListener('open', function(event) { // LOGIN
    socket.send(JSON.stringify({
        guid: id
    }));
});

socket.addEventListener('message', function(event) { // OnMessage
    if (isJSON(event.data)) { // IF json
        var message = JSON.parse(event.data);
        if (message.accepted === true) { // If webshocket allows message
            MSG_ALLOWED = true;
			
            if (!CONTENT[page]) {
                socket.send(JSON.stringify({
                    ACTION: "GET",
                    PAGE: page
                }));
            } else {
				Loop = true;
				setInterval(SendNewChanges, UpdateRate);
				console.log("Created new website")
			}
			
			} else {
            if (!MSG_ALLOWED) {
                alert("Website is read only");
            }
			if (message.restricted  === true) {
                alert("Provided GUID is not accepted");
				window.location.replace("/#Help!Denied-GUID");
            } else if (message.ACTION == "DOWNLOAD") {				
                html = message.DATA;
                document.documentElement.innerHTML = html;
                CONTENT[message.PAGE] = true;
				if(!Loop){
				Loop = true
                setInterval(SendNewChanges, UpdateRate); // Start changes loop
				}
            } else if (CONTENT[message.PAGE]) {
                switch (message.ACTION) {
                    case "GET":
                        if (MSG_ALLOWED) {
                            socket.send(JSON.stringify({
                                ACTION: "DOWNLOAD",
                                PAGE: message.PAGE,
                                DATA: document.documentElement.innerHTML
                            }))
                        }
                        break;

                    case "SYNC":
                        ApplyChanges(message);
                        break;
                }
            }
        }
    } else {
        alert("ERROR NOT JSON");
    }
});

function ApplyChanges(Patch) {
    if (Patch.PAGE == page) {
		html = dmp.patch_apply(Patch.DATA, document.documentElement.innerHTML)[0];
		document.documentElement.innerHTML = html;
    } else {
        alert("MUTI-PAGE not supported :(");
    }
}


function setURL(url) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
	  rURL = xhr.responseURL.split('?')[1];
      origin = new URL(rURL).origin;
      html = xhr.response;
      document.documentElement.innerHTML = "<base href='" + origin + "' />" + html;
	  CONTENT[page] = true;
    }
  }
  
  xhr.onerror = function() {
	  window.location.replace("/#Help!Unable-To-Download-Website");
  }
  
  xhr.open('GET', cors_proxy+encodeURI(url), true);
  xhr.send();
}

function GetParams() {
    URI = new URL(location.href);
    if (URI.searchParams.has("guid") && URI.searchParams.get("guid") != "") {
        id = URI.searchParams.get("guid");
    } else {
        is_error = true;
    }
    if (URI.searchParams.has("page")) {
        page = URI.searchParams.get("page")
    } else {
        page = "1";
    }
    if (URI.searchParams.has("StartURL")) {
		StartURL = URI.searchParams.get("StartURL");
		if(StartURL == "none"){
			console.log("StartURL is 'none' creating blank")
		}else{
			setURL(StartURL);
		}
		if (history.pushState) {
			URI.searchParams.delete("StartURL")
			window.history.pushState({path:URI.toString()},'',URI.toString());
		}
	}
    return is_error
}

function isJSON(str) {
    try {
        return (JSON.parse(str) && !!str);
    } catch (e) {
        return false;
    }
}