using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections;
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

    public string panelText;

    WebSocket ws;

    void Start()
    {
        // Call the function to fetch JSON data initially
        StartCoroutine(UpdateDataPeriodically());

        TextAsset gateway = Resources.Load("gateway") as TextAsset;
        String gateway_ip = gateway.ToString().split("\n")[0];

        var socketio_client = new SocketIOClass("http://" + gateway_ip.ToString() + ":4762");

        socketio_client.OnConnected += async (sender, e) => {
            Debug.Log("socket io connected");
        };

        socketio_client.On("taskUpdate", (task) => {
            var taskString = task.GetValue<string>();
            text.SetText(taskString);
        });


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
        text.SetText(panelText);
        yield break;
        /*
        using (UnityWebRequest request = UnityWebRequest.Get(telemetryEndpoint))
        {
            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error fetching data: " + request.error);
            }
            else
            {
                // Parse the received JSON data and update the text field
                string jsonData = request.downloadHandler.text;

                //text.SetText(jsonData);
                JsonNode recievedInformation = JsonSerializer.Deserialize<JsonNode>(jsonData);
                //this is adding all of the values 
                string textValue;
                textValue = ($"Heart_rate: {recievedInformation["telemetry"]["eva1"]["heart_rate"]}\n");
                textValue += ($"oxy_time_left: {recievedInformation["telemetry"]["eva1"]["oxy_time_left"]}\n");
                textValue += ($"batt_time_left: {recievedInformation["telemetry"]["eva1"]["batt_time_left"]}\n");
                textValue += ($"suit_pressure_total: {recievedInformation["telemetry"]["eva1"]["suit_pressure_total"]}\n");
                text.SetText(textValue);
            }
        }
        */
        
    }
}
