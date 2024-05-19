var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);

var GATEWAY_IP = urlParams.get("gateway_ip");

if (GATEWAY_IP == undefined) {
    GATEWAY_IP = prompt("Enter Gateway IP")
}

var ws = new WebSocket("ws://" + GATEWAY_IP + ":4761");

