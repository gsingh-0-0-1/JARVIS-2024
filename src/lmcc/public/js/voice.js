let socket = io("http://localhost:4762", {
    transports: ['websocket'],
    upgrade: false
});


//socket.on('connection', () => {
    //alert("conn")
if (window.location.href.includes("right")) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then((stream) => {

        const options = {
          mimeType: "audio/wav",
        };

        var mediaRecorder = new MediaRecorder(stream)//, options);
        var audioChunks = [];

        //console.log(mediaRecorder.mimeType)

        mediaRecorder.addEventListener("dataavailable", function (event) {
            //console.log(mediaRecorder)
            //console.log(event.data)
            /*
            var buf = new Response(event.data).arrayBuffer().then(res => {
                //console.log(res)
                var arr = new Int8Array(res);
                //console.log(arr)
                for (var i = 0; i < arr.length; i++) {
                    arr[i] = i % 2;
                }
                var newtemp = new Blob([new Uint8Array(arr.buffer, 0, res.length)]);
                console.log(newtemp)
                audioChunks.push(newtemp)

                var buf2 = new Response(newtemp).arrayBuffer().then(res => {
                    console.log(res)
                })
            })
            */
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", function () {
            var audioBlob = new Blob(audioChunks, { type: "audio/webm" });

            /*
            let url = URL.createObjectURL(audioBlob);
            let a = document.createElement('a');
            a.href = url;
            a.download = 'recorded_audio.webm';
            document.body.appendChild(a);
            a.click();
            */

            audioChunks = [];
            var fileReader = new FileReader();
            fileReader.readAsDataURL(audioBlob);
            fileReader.onloadend = function () {
                var base64String = fileReader.result;
                socket.emit("audioStream", base64String);
                //console.log("sending audio chunk", inum)
            };

            mediaRecorder.start();
            setTimeout(function () {
                mediaRecorder.stop();
            }, 100);
        });

        mediaRecorder.start();
        setTimeout(function () {
            mediaRecorder.stop();
        }, 100);
    })
    .catch((error) => {
        console.error('Error capturing audio.', error);
    });
}
//});

socket.on('audioStream', (audioData) => {
    console.log("got audio data")
    //alert("got audio")
    var newData = audioData.split(";");
    newData[0] = "data:audio/webm;";
    newData = newData[0] + newData[1];

    var audio = new Audio(newData);
    audio.play();
    
    if (window.location.href.includes("right")) {
        /*
        console.log("playing")
        setTimeout(function() {
            audio.play()
        }, 1000);
        //audio.volume = 0
        */
    }
    else {
        audio.play()
    }
    
    if (!audio || document.hidden) {
        return;
    }
    // audio.play();
});