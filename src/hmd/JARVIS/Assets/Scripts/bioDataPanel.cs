using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections;
using TMPro;
using System.Text.Json;
using System.Text.Json.Nodes;

public class bioDataPanel : MonoBehaviour
{
    public TMP_Text text;
    public static string serverURL = "http://data.cs.purdue.edu:14141/";
    public string telemetryEndpoint = serverURL + "/json_data/teams/0/TELEMETRY.json";


    void Start()
    {
        // Call the function to fetch JSON data initially
        StartCoroutine(UpdateDataPeriodically());
    }

    IEnumerator UpdateDataPeriodically()
    {
        while (true)
        {
            yield return new WaitForSeconds(5f); // Adjust the interval as needed
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
                //this is adding all of the values 
                string textValue;
                textValue = ($"Heart_rate: {recievedInformation["telemetry"]["eva1"]["heart_rate"]}\n");
                textValue += ($"oxy_time_left: {recievedInformation["telemetry"]["eva1"]["oxy_time_left"]}\n");
                textValue += ($"batt_time_left: {recievedInformation["telemetry"]["eva1"]["batt_time_left"]}\n");
                textValue += ($"suit_pressure_total: {recievedInformation["telemetry"]["eva1"]["suit_pressure_total"]}\n");
                text.SetText(textValue);
            }
        }
    }
}
