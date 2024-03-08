let socket = io("http://localhost:4762", {
    transports: ['websocket'],
    upgrade: false
});

//socket.on('connection', () => {
    //alert("conn")
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
.then((stream) => {

    var madiaRecorder = new MediaRecorder(stream);
    var audioChunks = [];

    madiaRecorder.addEventListener("dataavailable", function (event) {
        audioChunks.push(event.data);
    });

    madiaRecorder.addEventListener("stop", function () {
        var audioBlob = new Blob(audioChunks);
        audioChunks = [];
        var fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = function () {
            var base64String = fileReader.result;
            socket.emit("audioStream", base64String);
        };

        madiaRecorder.start();
        setTimeout(function () {
            madiaRecorder.stop();
        }, 100);
    });

    madiaRecorder.start();
    setTimeout(function () {
        madiaRecorder.stop();
    }, 100);
})
.catch((error) => {
    console.error('Error capturing audio.', error);
});
//});

socket.on('audioStream', (audioData) => {
    console.log("got audio data")
    //alert("got audio")
    var newData = audioData.split(";");
    newData[0] = "data:audio/ogg;";
    newData = newData[0] + newData[1];

    var audio = new Audio(newData);
    if (window.location.href.includes("right")) {
        console.log("playing")
        setTimeout(function() {
            audio.play()
        }, 1000);
        //audio.volume = 0
    }
    else {
        audio.play()
    }
    if (!audio || document.hidden) {
        return;
    }
    // audio.play();
});