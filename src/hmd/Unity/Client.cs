using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using WebSocketSharp;

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
            Debug.Log(UIAJsonString);
            ws.Send("{\"type\" : \"DEFAULT\", \"sender\" : \"HMD\", \"content\" : \"hi\"}");
        }

    }

}