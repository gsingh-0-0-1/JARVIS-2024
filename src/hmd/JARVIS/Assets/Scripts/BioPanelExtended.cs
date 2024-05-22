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

                //setting text for primary pressure
                float primPsi = recievedInformation["telemetry"][$"eva{whoAmI}"]["oxy_pri_pressure"].GetValue<float>();
                int primPsi_int = (int)primPsi;
                O2PressurePrim.SetText($"{primPsi_int}");

                //secondary oxy pressure
                float secPsi = recievedInformation["telemetry"][$"eva{whoAmI}"]["oxy_sec_pressure"].GetValue<float>();
                int secPsi_int = (int)secPsi;
                O2PressureSec.SetText($"{secPsi_int}");


                //Coolant
                float coolant = recievedInformation["telemetry"][$"eva{whoAmI}"]["coolant_ml"].GetValue<float>();
                coolantMl.SetText($"{coolant}");

                //temp
                float suitTemp = recievedInformation["telemetry"][$"eva{whoAmI}"]["temperature"].GetValue<float>();
                temp.SetText($"{suitTemp}");

                //oxy consump
                float consump = recievedInformation["telemetry"][$"eva{whoAmI}"]["oxy_consumption"].GetValue<float>();
                oxyConsumption.SetText($"{consump}");


                float batt_seconds = recievedInformation["telemetry"][$"eva{whoAmI}"]["batt_time_left"].GetValue<float>();
                int batt_minutes = (int) batt_seconds / 60;
                int batt_hours = batt_minutes / 60;
                int batt_min_right = batt_minutes % 60;

                if (batt_min_right < 10)
                {
                    battTimeLeft.SetText($"{batt_hours}: {batt_min_right}");
                }
                else
                {
                    battTimeLeft.SetText($"{batt_hours}: {batt_min_right}");
                }
            }
        }
    }
}
