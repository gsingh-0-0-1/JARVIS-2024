using System;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using WebSocketSharp;
using System.Text.Json;
using System.Text.Json.Nodes;
using UnityEngine.UI;
using TMPro;
using UnityEditor.AssetImporters;
using SocketIOClass = SocketIOClient.SocketIO;

public class Client : MonoBehaviour
{
    public TSScConnection TSSc;

    WebSocket ws;

    public TMP_InputField textboxx;
    public TMP_InputField textboxy;
    public TMP_InputField textboxdesc;
    public Boolean readyToPlay;
    public float[] dataArrFloat;

    UnicodeEncoding uniEncoding = new UnicodeEncoding();

    public AudioClip soundClip;
    public AudioSource audioSource;

    void Start()
    {
        // soundClip = AudioClip.Create("sound_chunk", 10000, 1, 44100, false);

        TSSc = new TSScConnection();
        string host = "data.cs.purdue.edu";
        // TSSc.ConnectToHost(host, 7);

        TextAsset gateway = Resources.Load("gateway") as TextAsset;
        String gateway_ip = gateway.ToString().Split("\n")[0];

        // TSSc = new TSScConnection();
        ws = new WebSocket("ws://" + gateway_ip.ToString() + ":4761");
        ws.ConnectAsync();
        ws.OnOpen += (sender, e) => {
               Debug.Log("Connected");
        };
        ws.OnMessage += (sender, e) =>
        {
            byte[] dataBytes = e.RawData;
            string dataString = System.Text.Encoding.UTF8.GetString(dataBytes);
            JsonNode recievedInformation = JsonSerializer.Deserialize<JsonNode>(dataString)!;

            // Debug.Log("Message Received from "+((WebSocket)sender).Url+", Data : " + recievedInformation);
        };
        ws.OnError += (sender, e) => {
                Debug.Log(e.Message);
        };

        var socketio_client = new SocketIOClass("http://" + gateway_ip.ToString() + ":4762");

        socketio_client.OnConnected += async (sender, e) => {
            Debug.Log("socket io connected");
        };

        audioSource = GetComponent<AudioSource>();

        socketio_client.On("audioStream", response => {
            // Debug.Log("got audio");
            
            var audioData = response.GetValue<string>();//.Split("base64,")[1];
            // Debug.Log(response.GetValue<string>());
            // Debug.Log(audioData);
            // memStream.Write(audioData, 0, audioData.Length);
            // AudioClip audioClip = WavUtility.ToAudioClip(memStream);
            // AudioSource audioSource;

            byte[] dataArrByte = Convert.FromBase64String(audioData);//memStream.ToArray();

            //float[] 
            dataArrFloat = new float[dataArrByte.Length / 2];

            for (int i = 44; i < dataArrFloat.Length; i++) {
                short sample = BitConverter.ToInt16(dataArrByte, i * 2);
                dataArrFloat[i] = sample / 32768f;
            }

            readyToPlay = true;

            //soundClip = new AudioClip();

            // SoundPlayer soundPlayer = new SoundPlayer();
            // soundPlayer.Stream = memStream;
            // soundPlayer.Play();
            // memStream.position = 0;
            // Debug.Log(response);
        });

        socketio_client.ConnectAsync();
    }

    void procAndPlay() {
        // Debug.Log("here 1");
        soundClip = AudioClip.Create("sound_chunk", Convert.ToInt32(dataArrFloat.Length), 1, 48000, false);
        // Debug.Log("here 2");
        soundClip.SetData(dataArrFloat, 0);
        // Debug.Log("here 3");
        audioSource.clip = soundClip;
        // Debug.Log("here 4");
        audioSource.Play();
        // Debug.Log("here " + audioSource.isPlaying.ToString());
    }

    void Update()
    {

        if (readyToPlay) {
            procAndPlay();
            readyToPlay = false;
        }

    }

    public void OnButtonClick()
    {
        string IMUJsonString = TSSc.GetIMUJsonString();
        JsonNode IMUJson = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
        float posx = IMUJson["imu"]["eva1"]["posx"].GetValue<float>();
        float posy = IMUJson["imu"]["eva1"]["posy"].GetValue<float>();

        SendGEOPin(posx, posy, "EVA1 Coords");

    }

    void SendGEOPin(float x, float y, string desc) {

        DateTime now = DateTime.UtcNow;
        string timestamp = now.ToString("yyyy-MM-ddTHH:mm:ssZ");

        var json = new {
            content = new {
                coords = new { x = x, y = y },
                desc = desc,
            },
            sender = "HMD",
            type = "GEOPIN",
            timestamp = timestamp,
        };

        string jsonString = JsonSerializer.Serialize(json);

        ws.Send(jsonString);

    }

    void SendBreadcrumbs(float x, float y, string desc) {

        DateTime now = DateTime.UtcNow;
        string timestamp = now.ToString("yyyy-MM-ddTHH:mm:ssZ");

        var json = new {
            content = new {
                coords = new { x = x, y = y },
                desc = desc,
            },
            sender = "HMD",
            type = "breadcrumbs",
            timestamp = timestamp,
        };

        string jsonString = JsonSerializer.Serialize(json);

        ws.Send(jsonString);

    }

}
