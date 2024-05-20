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
    public int PLAYER;

    public TMP_Text TSS_Input;
    public TMP_Text GATEWAY_Input;
  
    public GameObject GeopinButton;
    public GameObject Task_Panel;
    public GameObject TaskButton;
    public GameObject HeartRate;
    public GameObject O2TimeLeft;

    public GameObject EVA1;
    public GameObject EVA2;
    public GameObject Rover;

    void Start() {
        TSS_ADDR = "data.cs.purdue.edu";// "192.168.51.110";
        GATEWAY_ADDR = "data.cs.purdue.edu";
        PLAYER = 2;
        startScripts = true;
        //StartCoroutine(FetchIPData());
    }

    IEnumerator FetchIPData()
    {
        using (UnityWebRequest request = UnityWebRequest.Get("http://data.cs.purdue.edu:4763/ips.txt"))
        {
            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                // set default here if needed
                TSS_ADDR = "";
                GATEWAY_ADDR = "";
                startScripts = true;
                Debug.Log("Error fetching data: " + request.error);
            }
            else
            {
                String[] textData = request.downloadHandler.text.Split("\n");
                Debug.Log("FETCHED " + textData[0] + " " + textData[1]);
                TSS_ADDR = textData[0];
                GATEWAY_ADDR = textData[1];
                PLAYER = Convert.ToInt32(textData[2]);
                startScripts = true;
            }
        }
    }

    void Update() {
        if (startScripts) {
            GeopinButton.GetComponent<Client>().Start_Custom(TSS_ADDR, GATEWAY_ADDR, PLAYER);
            TaskButton.GetComponent<taskPanel>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            Task_Panel.GetComponent<UIADetectionHandler>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            HeartRate.GetComponent<rate>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            O2TimeLeft.GetComponent<O2_time>().Start_Custom(TSS_ADDR, GATEWAY_ADDR);
            EVA1.GetComponent<Marker_EVA>().Start_Custom(TSS_ADDR, GATEWAY_ADDR, PLAYER);
            EVA2.GetComponent<Marker_EVA>().Start_Custom(TSS_ADDR, GATEWAY_ADDR, PLAYER);
            Rover.GetComponent<Marker_EVA>().Start_Custom(TSS_ADDR, GATEWAY_ADDR, PLAYER);
            startScripts = false;
        }
    }
}
