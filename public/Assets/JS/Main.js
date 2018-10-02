var url;
var thing = "https://inspectme.tk/Web/?guid="

function addhttps(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "https://" + url;
    }
    return url;
}

function GetStarted() {
url = prompt("Please enter an url (optional):");

if (url === null) {
return;
}

if(url){
url = addhttps(url);
}else{
url = "none";
}
var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
	  redirect(JSON.parse(xhr.response).client);
    }
  } 
  xhr.onerror = function() {
	  window.location.replace("/#Help!Unable-To-Create-WebShocket");
  }
  xhr.open('GET', "https://node2.wsninja.io/?gen=broadcast", true);
  xhr.send();
}
function redirect(guid){
  prompt("Give this to someone idk: ", thing + guid);
  window.location.replace(thing + guid + "&StartURL=" + url);
}