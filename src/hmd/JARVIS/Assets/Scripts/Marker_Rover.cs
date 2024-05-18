using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections;
using TMPro;
using System.Text.Json;
using System.Text.Json.Nodes;

public class Marker_Rover : MonoBehaviour
{

    public TSScConnection TSSc;

    public TMP_Text text;
    public static string serverURL = "http://data.cs.purdue.edu:14141/";
    private string telemetryEndpoint = serverURL + "/json_data/IMU.json";
    
    public int xpos = 1000;
    public int ypos = 1000;

    public int TOP_LEFT_EASTING = 298305;
    public int TOP_LEFT_NORTHING = 3272438;
    
    public int BOT_RIGHT_EASTING = 298405;
    public int BOT_RIGHT_NORTHING = 3272330;

    void Start()
    {
        // Call the function to fetch JSON data initially
        string host = "data.cs.purdue.edu";
        TSSc.ConnectToHost(host, 7);
        StartCoroutine(UpdateEVLocs());

    }

    IEnumerator UpdateEVLocs()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f); // Adjust the interval as needed
            yield return StartCoroutine(FetchEVLocs());
        }
    }

    IEnumerator FetchEVLocs()
    {

        

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
                //text.SetText($"{jsonData}");
                float x = 0.0f;
                float y = 0.0f;
                if (gameObject.name == "Marker_EVA1") {
                    x = recievedInformation["imu"]["eva1"]["posx"].GetValue<float>();
                    y = recievedInformation["imu"]["eva1"]["posy"].GetValue<float>();
                }
                if (gameObject.name == "Marker_EVA2") {
                    x = recievedInformation["imu"]["eva2"]["posx"].GetValue<float>();
                    y = recievedInformation["imu"]["eva2"]["posy"].GetValue<float>();
                }

                double mapHeight = 0.1177;
                double mapWidth = 0.11;

                float xfloat = (float)(((x - TOP_LEFT_EASTING) / (BOT_RIGHT_EASTING - TOP_LEFT_EASTING)) * mapHeight - mapHeight * 0.5);
                float yfloat = (float)(((y - TOP_LEFT_NORTHING) / (TOP_LEFT_NORTHING - BOT_RIGHT_NORTHING)) * mapWidth + mapWidth * 0.5);

                transform.localPosition = new Vector3(xfloat, yfloat, -0.002f);

                // float hr_float = recievedInformation["telemetry"]["eva1"]["heart_rate"].GetValue<float>();
                // int hr_int = (int)hr_float;
                // text.SetText($"{hr_int}");
            }

            //yield break;
        }
        
    }
}
