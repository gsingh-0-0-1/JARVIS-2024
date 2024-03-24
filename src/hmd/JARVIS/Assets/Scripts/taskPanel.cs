using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using System.Text.Json;
using System.Text.Json.Nodes;
using SocketIOClass = SocketIOClient.SocketIO;
using WebSocketSharp;

public class bioDataPanel : MonoBehaviour
{
    public TMP_Text text;
    public static string serverURL = "http://data.cs.purdue.edu:14141/";
    public string telemetryEndpoint = serverURL + "/json_data/teams/0/TELEMETRY.json";

    public List<string> remainingTasks = new List<string>();

    public string panelText;

    WebSocket ws;

    void Start()
    {
        // Call the function to fetch JSON data initially
        StartCoroutine(UpdateDataPeriodically());

        TextAsset gateway = Resources.Load("gateway") as TextAsset;
        string gateway_ip = gateway.ToString().Split("\n")[0];

        var socketio_client = new SocketIOClass("http://" + gateway_ip.ToString() + ":4762");

        socketio_client.OnConnected += (sender, e) => {
            Debug.Log("socket io connected");
        };

        /*
        socketio_client.On("taskUpdate", (task) => {
            var taskString = task.GetValue<string>();
            remainingTasks.Add(taskString);
            StartCoroutine(RenderNextTask());
            // text.SetText(taskString);
        });
        */


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

            string tasktype = JsonSerializer.Deserialize<string>(recievedInformation["type"]);


            if (tasktype == "TASK")
            {
                Debug.Log("detected new task");
                string taskDesc = ($"{recievedInformation["content"]["taskDesc"]}");
                Debug.Log(taskDesc);
                // remainingTasks.Add(taskDesc);
                panelText = taskDesc;
                //StartCoroutine(UpdateDisplayText(text, taskDesc));
                //text.SetText(taskDesc);
            }

            Debug.Log("Message Received from " + ((WebSocket)sender).Url + ", Type: " + tasktype + " Data : " + recievedInformation);


        };
        ws.OnError += (sender, e) => {
            Debug.Log(e.Message);
        };
    }

    IEnumerator RenderNextTask()
    {
        if (remainingTasks.Count == 0) {
            text.SetText("All Tasks Complete");
        }
        else {
            text.SetText(remainingTasks[0]);
            remainingTasks.Remove(remainingTasks[0]);
        }
        yield break;
    }
    

    IEnumerator UpdateDataPeriodically()
    {
        while (true)
        {
            yield return new WaitForSeconds(0.25f); // Adjust the interval as needed
            yield return StartCoroutine(FetchBioJSONData());
        }
    }

    IEnumerator FetchBioJSONData()
    {
        Debug.Log("updating panel text");
        text.SetText(panelText);
        yield break;
        
    }
}
