using System;
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

public class Client : MonoBehaviour
{
    public TSScConnection TSSc;

    WebSocket ws;

    public TMP_InputField textboxx;
    public TMP_InputField textboxy;
    public TMP_InputField textboxdesc;

    void Start()
    {
        ws = new WebSocket("ws://localhost:4761");
        ws.ConnectAsync();
        ws.OnOpen += (sender, e) => {
               Debug.Log("Connected");
        };
        ws.OnMessage += (sender, e) =>
        {
            byte[] dataBytes = e.RawData;
            string dataString = System.Text.Encoding.UTF8.GetString(dataBytes);
            JsonNode recievedInformation = JsonSerializer.Deserialize<JsonNode>(dataString)!;

            Debug.Log("Message Received from "+((WebSocket)sender).Url+", Data : " + recievedInformation);
        };
        ws.OnError += (sender, e) => {
                Debug.Log(e.Message);
        };

        string host = "data.cs.purdue.edu";
        TSSc.ConnectToHost(host, 7);
    }

    void Update()
    {

        if (Input.GetKeyDown(KeyCode.RightArrow)) {
            Debug.Log("Right Arrow pressed");

            string IMUJsonString = TSSc.GetIMUJsonString();
            JsonNode IMUJson = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
            float posx = IMUJson["imu"]["eva1"]["posx"].GetValue<float>();
            Debug.Log($"IMU posx: {posx}");

            SendGEOPin(posx, 1, "hi");
            SendBreadcrumbs(-0.14f, posx, "bread");

        }

    }

    public void OnButtonClick()
    {
        string textx = textboxx.text;
        string texty = textboxy.text;
        string textdesc = textboxdesc.text;

        SendGEOPin(float.Parse(textx), float.Parse(texty), textdesc);

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
