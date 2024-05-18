using System;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using WebSocketSharp;
using System.Text.Json;
using System.Text.Json.Nodes;
using UnityEngine.UI;
using TMPro;
// using UnityEditor.AssetImporters;
using SocketIOClass = SocketIOClient.SocketIO;
using UnityEngine.Networking;

public class Startup : MonoBehaviour
{
    Boolean startScripts = false;

    public String TSS_ADDR = null;
    public String GATEWAY_ADDR = null;

    public TMP_Text TSS_Input;
    public TMP_Text GATEWAY_Input;
  
    public GameObject GeopinButton;
    public GameObject Task_Panel;
    public GameObject TaskButton;
    public GameObject HeartRate;
    public GameObject O2TimeLeft;

    void Start() {
        StartCoroutine(FetchIPData());
    }

    IEnumerator FetchIPData()
    {
        using (UnityWebRequest request = UnityWebRequest.Get("http://data.cs.purdue.edu:4763/ips.txt"))
        {
            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error fetching data: " + request.error);
            }
            else
            {
                String[] textData = request.downloadHandler.text.Split("\n");
                Debug.Log("FETCHED " + textData[0] + " " + textData[1]);
                TSS_ADDR = textData[0];
                GATEWAY_ADDR = textData[1];
                startScripts = true;
            }
        }
    }

    void Update() {
        if (startScripts) {
            GeopinButton.GetComponent<Client>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            TaskButton.GetComponent<taskPanel>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            Task_Panel.GetComponent<UIADetectionHandler>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            HeartRate.GetComponent<rate>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            O2TimeLeft.GetComponent<O2_time>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            startScripts = false;
        }
    }
}
