using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections.Generic;
using System.Collections;
using TMPro;
using System.Text.Json;
using System.Text.Json.Nodes;
using System;

public class BioPanelExtended : MonoBehaviour
{

    public TMP_Text O2PressurePrim;
    public TMP_Text O2PressureSec;
    public TMP_Text coolantMl;
    public TMP_Text temp;
    public TMP_Text oxyConsumption;
    public TMP_Text battTimeLeft;

    public String serverURL = "http://data.cs.purdue.edu:14141/";
    private String telemetryEndpoint;
    public int whoAmI;

    public void Start_Custom(String host, String gatewap_ip, int evnum)
    {
        serverURL = "http://" + host + ":14141/";
        telemetryEndpoint = serverURL + "/json_data/teams/7/TELEMETRY.json";
        whoAmI = evnum;
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
                float psi = recievedInformation["telemetry"]["eva1"]["oxy_pri_pressure"].GetValue<float>();
                int psi_int = (int)psi;
                O2PressurePrim.SetText($"{psi_int}");
            }
        }
    }
}
