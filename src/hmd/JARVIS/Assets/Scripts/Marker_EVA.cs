using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections;
using TMPro;
using System.Text.Json;
using System.Text.Json.Nodes;

public class Marker_EVA : MonoBehaviour
{

    public TSScConnection TSSc;

    public TMP_Text text;
    public static string serverURL = "http://data.cs.purdue.edu:14141/";
    private string telemetryEndpoint = serverURL + "/json_data/IMU.json";

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
        string IMUJsonString = TSSc.GetIMUJsonString();
        Debug.Log(IMUJsonString);
        JsonNode IMUJson = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;

        float x = 0.0f;
        float y = 0.0f;
        if (gameObject.name == "Marker_EVA1") {
            x = IMUJson["imu"]["eva1"]["posx"].GetValue<float>();
            y = IMUJson["imu"]["eva1"]["posy"].GetValue<float>();
        }
        if (gameObject.name == "Marker_EVA2") {
            x = IMUJson["imu"]["eva2"]["posx"].GetValue<float>();
            y = IMUJson["imu"]["eva2"]["posy"].GetValue<float>();
        }

        transform.localPosition = new Vector3((0.11f * (x / 3000f)) - 0.055f, (0.11f * (y / 3000f)) - 0.055f, -0.002f);
        yield break;

        /*

        using (UnityWebRequest request = UnityWebRequest.Get(telemetryEndpoint))
        {
            request.SendWebRequest();

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

                transform.localPosition = new Vector3((0.11f * (x / 3000f)) - 0.055f, (0.11f * (y / 3000f)) - 0.055f, -0.002f);

                // float hr_float = recievedInformation["telemetry"]["eva1"]["heart_rate"].GetValue<float>();
                // int hr_int = (int)hr_float;
                // text.SetText($"{hr_int}");
            }

            yield break;
        }
        */
    }
}
