using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using WebSocketSharp;
using System.Text.Json;
using System.Text.Json.Nodes;

public class Client : MonoBehaviour
{
    public TSScConnection TSSc;

    WebSocket ws;

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

        if (Input.GetKeyDown(KeyCode.Space)) {
            Debug.Log("Space pressed");

//            string UIAJsonString = TSSc.GetUIAJsonString();
//            JsonNode UIAJson = JsonSerializer.Deserialize<JsonNode>(UIAJsonString)!;
//            bool eva1_power = UIAJson["uia"]["eva1_power"].GetValue<bool>();
//            Debug.Log($"UIA eva1_power: {eva1_power}");

            string IMUJsonString = TSSc.GetIMUJsonString();
            JsonNode IMUJson = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
            float posx = IMUJson["imu"]["eva1"]["posx"].GetValue<float>();
            Debug.Log($"IMU posx: {posx}");

            sendPin(posx, 1, "hi", "HMD", "12:00");

        }

    }

    void sendPin(float x, float y, string desc, string sender, string timestamp) {
    /*
    {
        "coords": {
                "x": 123,
                "y": 123
        },
        "desc":"adasdasd",
        "sender": "LMCC or HMD",
        "timestamp": "whataever"
    } 
    */

            var json = new {
                coords = new {
                    x = x,
                    y = y,
                },
                desc = desc,
                sender = sender,
                timestamp = timestamp,
            };

            string jsonString = JsonSerializer.Serialize(json);

            ws.Send(jsonString);

    }

}