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
// using UnityEditor.AssetImporters;
using SocketIOClass = SocketIOClient.SocketIO;


public class Client : MonoBehaviour
{
    public TSScConnection TSSc;

    WebSocket ws;

    public TMP_InputField textboxx;
    public TMP_InputField textboxy;
    public TMP_InputField textboxdesc;

    public float[] dataArrFloat;

    public List<Vector3> pins_to_render = new List<Vector3>();

    UnicodeEncoding uniEncoding = new UnicodeEncoding();


    public GameObject markerPrefab;
    public GameObject mapCanvas;

    void Start()
    {
        //StartCoroutine(renderGeoPin(0, 0));

        // soundClip = AudioClip.Create("sound_chunk", 10000, 1, 44100, false);

        // TSSc = new TSScConnection();
        string host = "data.cs.purdue.edu";
        TSSc.ConnectToHost(host, 7);

        TextAsset gateway = Resources.Load("gateway") as TextAsset;
        string gateway_ip = gateway.ToString().Split("\n")[0];

        Debug.Log("GATEWAY IP " + gateway_ip);

        // TSSc = new TSScConnection();
        ws = new WebSocket("ws://data.cs.purdue.edu:4761");
        ws.ConnectAsync();
        ws.OnOpen += (sender, e) => {
               Debug.Log("Connected");
        };
        ws.OnMessage += (sender, e) =>
        {
            byte[] dataBytes = e.RawData;
            string dataString = System.Text.Encoding.UTF8.GetString(dataBytes);
            JsonNode recievedInformation = JsonSerializer.Deserialize<JsonNode>(dataString)!;

            string tasktype = JsonSerializer.Deserialize<string>(recievedInformation["type"]);

            if (tasktype == "GEOPIN")
            {
                Debug.Log("Geo Pin received");
                var x = int.Parse($"{recievedInformation["content"]["coords"]["x"]}");
                var y = int.Parse($"{recievedInformation["content"]["coords"]["y"]}");
                Debug.Log("parsed coords " + x.ToString() + " " + y.ToString());

                renderGeoPin(x, y);
            }

            // Debug.Log("Message Received from "+((WebSocket)sender).Url+", Data : " + recievedInformation);
        };
        ws.OnError += (sender, e) => {
                Debug.Log(e.Message);
        };

    }

    void Update()
    {
        while (pins_to_render.Count() != 0) {
            GameObject new_geopin_marker = Instantiate(markerPrefab, mapCanvas.GetComponent<RectTransform>());
            new_geopin_marker.GetComponent<RectTransform>().localPosition = pins_to_render[0];
            pins_to_render.Remove(pins_to_render[0]);
            new_geopin_marker.SetActive(true);
        }
    }

    public void OnGeoPinButtonClick()
    {
        Debug.Log("geo button clicked");
        string IMUJsonString = TSSc.GetIMUJsonString();
        JsonNode IMUJson = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
        float posx = IMUJson["imu"]["eva1"]["posx"].GetValue<float>();
        float posy = IMUJson["imu"]["eva1"]["posy"].GetValue<float>();

        SendGEOPin(posx, posy, "EVA1 Coords");

        renderGeoPin(posx, posy);
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

    void renderGeoPin(float x, float y) {
	Debug.Log("here");
	try {     
 
        double mapHeight = 0.11;
        double mapWidth = 0.11;

        Debug.Log("made active");

        float xfloat = (float)((x / 4251.0) * mapHeight - mapHeight * 0.5);
        float yfloat = (float)((-y / 3543.0) * mapWidth + mapWidth * 0.5);
        float zfloat = 0.001f;

        Debug.Log("computed coords");

        pins_to_render.Add(new Vector3(xfloat, yfloat, zfloat));

        Debug.Log("applied coord transform");
        }
        catch(Exception e) {
        Debug.Log(e.Message);
	}

    }
}
