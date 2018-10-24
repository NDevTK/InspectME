var url;
var thing = "https://inspectme.tk/Web/?guid="

function is_url(str)
{
  regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        if (regexp.test(str))
        {
          return true;
        }
        else
        {
          return false;
        }
}

function GetStarted() {
url = prompt("Please enter an url (optional):");

if (url === null) {
return;
}

if(!url){
url = "none";
}else if (!is_url(url)){
  alert("Not an valid URL :(");
  window.location.replace("/#Help!URL-Not-Valid");
}

var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
	  redirect(JSON.parse(xhr.response).client);
    }
  } 
  xhr.onerror = function() {
    alert("wsninja the 3rd party WebSocket host we use is currently offline. please contact me on discord");
	  window.location.replace("/#Help!Unable-To-Create-WebShocket");
  }
  xhr.open('GET', "https://node2.wsninja.io/?gen=broadcast", true);
  xhr.send();
}
function redirect(guid){
  prompt("Give this to someone idk: ", thing + guid);
  window.location.replace(thing + guid + "&StartURL=" + url);
}