using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections.Generic;
using System.Collections;
using TMPro;
using System.Text.Json;
using System.Text.Json.Nodes;
using System;

public class O2_time : MonoBehaviour
{
    public TMP_Text text;
    public String serverURL = "http://data.cs.purdue.edu:14141/";
    private String telemetryEndpoint;
    public Image barImage;

    public void Start_Custom(String host, String gateway_ip)
    {
        serverURL = "http://" + host + ":14141/";
        telemetryEndpoint = serverURL + "/json_data/teams/7/TELEMETRY.json";
        // Call the function to fetch JSON data initially
        StartCoroutine(UpdateDataPeriodically());
    }

    IEnumerator UpdateDataPeriodically()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f); // Adjust the interval as needed
            yield return StartCoroutine(FetchBioJSONData());
        }
    }

    IEnumerator FetchBioJSONData()
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
                int oxy_seconds = recievedInformation["telemetry"]["eva1"]["oxy_time_left"].GetValue<int>();
                int oxy_minutes = oxy_seconds / 60;
                int oxy_hours = oxy_minutes / 60;
                int oxy_min_right = oxy_minutes % 60;
                if (oxy_min_right < 10)
                {
                    text.SetText($"{oxy_hours}: 0{oxy_min_right}");
                }
                else
                {
                    text.SetText($"{oxy_hours}: {oxy_min_right}");
                }
                float fillValue = (float)oxy_minutes / 70;

                barImage.fillAmount = fillValue;
            }
        }
    }
}
