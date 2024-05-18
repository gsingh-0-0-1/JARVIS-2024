using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using System.Text.Json;
using System.Text.Json.Nodes;
using SocketIOClass = SocketIOClient.SocketIO;
using WebSocketSharp;

public class taskPanel : MonoBehaviour
{
    public TMP_Text text;
    public static string serverURL = "http://data.cs.purdue.edu:14141";
    public string telemetryEndpoint = serverURL + "/json_data/teams/0/TELEMETRY.json";

    public List<string> remainingTasks = new List<string>();

    public string panelText;

    WebSocket ws;
    //WebSocket websocket;

    public int i = 0;

    public void Start_Custom(String host, String gateway_ip)
    {
        // Call the function to fetch JSON data initially
        StartCoroutine(UpdateDataPeriodically());

        // TextAsset gateway = Resources.Load("gateway") as TextAsset;
        // String gateway_ip = gateway.ToString().Split("\n")[0];

        
        ws = new WebSocket("ws://" + gateway_ip + ":4761");
        ws.ConnectAsync();
        ws.OnOpen += (sender, e) => {
            Debug.Log("Connected");
        };
        ws.OnMessage += (sender, e) =>
        {
            i = i + 1;
            byte[] dataBytes = e.RawData;
            string dataString = System.Text.Encoding.UTF8.GetString(dataBytes);
            JsonNode recievedInformation = JsonSerializer.Deserialize<JsonNode>(dataString)!;

            string tasktype = JsonSerializer.Deserialize<string>(recievedInformation["type"]);


            if (tasktype == "TASK")
            {
                Debug.Log("detected new task " + remainingTasks.Count.ToString());
                string taskDesc = ($"{recievedInformation["content"]["taskDesc"]}");
                Debug.Log(taskDesc);
                remainingTasks.Add(taskDesc);
                if (remainingTasks.Count == 0) {
                    //text.SetText(taskDesc);
                }
                else {
                    //remainingTasks.Add(taskDesc);
                }
            }

            //Debug.Log("Message Received from " + ((WebSocket)sender).Url + ", Type: " + tasktype + " Data : " + recievedInformation);


        };
        ws.OnError += (sender, e) => {
            Debug.Log(e.Message);
        };
        
    }

    public void RenderNextTask()
    {
        if (remainingTasks.Count == 0) {
            text.SetText("No Active Tasks");
        }
        else {
            text.SetText(remainingTasks[0]);
            remainingTasks.Remove(remainingTasks[0]);
        }
    }
    

    IEnumerator UpdateDataPeriodically()
    {
        while (true)
        {
            yield return new WaitForSeconds(0.1f); // Adjust the interval as needed
            if (remainingTasks.Count != 0) {
                text.SetText(remainingTasks[0]);
            }
            else { 
                text.SetText("No Active Tasks");
            }
        }
    }

}
