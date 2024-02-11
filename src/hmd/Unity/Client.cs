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

    string UIAJsonString;
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
            Debug.Log("Message Received from "+((WebSocket)sender).Url+", Data : " + dataString);

            JsonNode recievedInformation = JsonSerializer.Deserialize<JsonNode>(dataString)!;
            Debug.Log($"JsonNode Received: {recievedInformation}");
        };
        ws.OnError += (sender, e) => {
                Debug.Log(e.Message);
        };

        string host = "data.cs.purdue.edu";
        TSSc.ConnectToHost(host, 7);
    }

    void Update()
    {
        if (TSSc.isUIAUpdated())
        {
            Debug.Log("UIA Updated");
            UIAJsonString = TSSc.GetUIAJsonString();
        }

        if (Input.GetKeyDown(KeyCode.Space)) {
            Debug.Log("Space pressed");

            JsonNode recievedInformation = JsonSerializer.Deserialize<JsonNode>(UIAJsonString)!;
            bool eva1_power = recievedInformation["uia"]["eva1_power"].GetValue<bool>();
            Debug.Log($"UIA eva1_power: {eva1_power}");

            ws.Send($"{{\"type\" : \"DEFAULT\", \"sender\" : \"HMD\", \"content\" : \"{eva1_power}\"}}");
        }

    }

}