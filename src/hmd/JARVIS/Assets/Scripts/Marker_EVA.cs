using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections;
using TMPro;
using System.Text.Json;
using System.Text.Json.Nodes;
using System;

public class Marker_EVA : MonoBehaviour
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

    public GameObject ActiveEVAMarker;

    public int Player;

    public void Start_Custom(String host, String gateway_ip, int p)
    {
        Player = p;
        // Call the function to fetch JSON data initially
        TSSc.ConnectToHost(host, 7);
        StartCoroutine(UpdateEVLocs());

    }

    IEnumerator UpdateEVLocs()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f); // Adjust the interval as needed
            yield return StartCoroutine(FetchLoc());
        }
    }

    IEnumerator FetchLoc()
    {
        JsonNode locJsonData;

        float x = 0.0f;
        float y = 0.0f;
        float z = 0.0f;
  

        if (gameObject.name == "Marker_EVA1") {
            string IMUJsonString = TSSc.GetIMUJsonString();
            locJsonData = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
            x = locJsonData["imu"]["eva1"]["posx"].GetValue<float>();
            y = locJsonData["imu"]["eva1"]["posy"].GetValue<float>();
        }
        if (gameObject.name == "Marker_EVA2") {
            string IMUJsonString = TSSc.GetIMUJsonString();
            locJsonData = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
            x = locJsonData["imu"]["eva2"]["posx"].GetValue<float>();
            y = locJsonData["imu"]["eva2"]["posy"].GetValue<float>();
        }
        if (gameObject.name == "Marker_Rover") {
            string RoverJsonString = TSSc.GetROVERJsonString();
            locJsonData = JsonSerializer.Deserialize<JsonNode>(RoverJsonString)!;
            x = locJsonData["rover"]["posx"].GetValue<float>();
            y = locJsonData["rover"]["posy"].GetValue<float>();
        }        

        double mapHeight = 0.1177;
        double mapWidth = 0.11;

        float xfloat = (float)(((x - TOP_LEFT_EASTING) / (BOT_RIGHT_EASTING - TOP_LEFT_EASTING)) * mapHeight - mapHeight * 0.5);
        float yfloat = (float)(((y - TOP_LEFT_NORTHING) / (TOP_LEFT_NORTHING - BOT_RIGHT_NORTHING)) * mapWidth + mapWidth * 0.5);

        if (Player == 1)
        {
            if (gameObject.name == "Marker_EVA1")
            {
                transform.localPosition = new Vector3(xfloat, yfloat, 0.001f);
                ActiveEVAMarker.transform.localPosition = new Vector3(xfloat, yfloat, -0.001f);
            }
            else
            {
                transform.localPosition = new Vector3(xfloat, yfloat, -0.001f);
            }
        }
        if (Player == 2)
        {
            if (gameObject.name == "Marker_EVA2")
            {
                transform.localPosition = new Vector3(xfloat, yfloat, 0.001f);
                ActiveEVAMarker.transform.localPosition = new Vector3(xfloat, yfloat, -0.001f);
            }
            else
            {
                transform.localPosition = new Vector3(xfloat, yfloat, -0.001f);
            }
        }



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
                if (gameObject.name == "Marker_Rover") {
                    
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
        */
        
    }
}
