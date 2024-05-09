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


public class Client : MonoBehaviour
{
    public TSScConnection TSSc;

    WebSocket ws;

    public TMP_InputField textboxx;
    public TMP_InputField textboxy;
    public TMP_InputField textboxdesc;

    public float[] dataArrFloat;

    public List<Vector3> pins_to_render = new List<Vector3>();
    public List<Vector3> navarrows_to_render = new List<Vector3>();
    public List<GameObject> current_navarrows = new List<GameObject>();

    UnicodeEncoding uniEncoding = new UnicodeEncoding();

    public int TOP_LEFT_EASTING = 298305;
    public int TOP_LEFT_NORTHING = 3272438;
    
    public int BOT_RIGHT_EASTING = 298405;
    public int BOT_RIGHT_NORTHING = 3272330;

    public GameObject navarrowPrefab;
    public GameObject markerPrefab;
    public GameObject mapCanvas;

    public GameObject GameCamera;

    void Start()
    {
        //StartCoroutine(renderGeoPin(0, 0));

        // soundClip = AudioClip.Create("sound_chunk", 10000, 1, 44100, false);

        // TSSc = new TSScConnection();
        string host = "data.cs.purdue.edu";
        TSSc.ConnectToHost(host, 7);

        TextAsset gateway = Resources.Load("gateway") as TextAsset;
        string gateway_ip = gateway.ToString().Split("\n")[0];

        Debug.Log("GATEWAY IP " + gateway_ip);

        // TSSc = new TSScConnection();
        ws = new WebSocket("ws://data.cs.purdue.edu:4761");
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

            if (tasktype == "GEOPIN")
            {
                Debug.Log("Geo Pin received");
                var x = int.Parse($"{recievedInformation["content"]["coords"]["x"]}");
                var y = int.Parse($"{recievedInformation["content"]["coords"]["y"]}");
                Debug.Log("parsed coords " + x.ToString() + " " + y.ToString());

                renderGeoPin(x, y);
            }

            if (tasktype == "NAVTARGET") {
                Debug.Log("Navtarget received");
                var x = int.Parse($"{recievedInformation["content"]["coords"]["x"]}");
                var y = int.Parse($"{recievedInformation["content"]["coords"]["y"]}");
                Debug.Log("parsed coords " + x.ToString() + " " + y.ToString());

                navToCoords(x, y);
            }

            // Debug.Log("Message Received from "+((WebSocket)sender).Url+", Data : " + recievedInformation);
        };
        ws.OnError += (sender, e) => {
                Debug.Log(e.Message);
        };

    }

    void Update()
    {
        while (pins_to_render.Count() != 0) {
            GameObject new_geopin_marker = Instantiate(markerPrefab, mapCanvas.GetComponent<RectTransform>());
            new_geopin_marker.GetComponent<RectTransform>().localPosition = pins_to_render[0];
            pins_to_render.Remove(pins_to_render[0]);
            new_geopin_marker.SetActive(true);
        }

        while (navarrows_to_render.Count() != 0) {
           // TODO: account for heading via the z-component of navarrows_to_render[0]

           GameObject new_nav_arrow = Instantiate(navarrowPrefab);
           new_nav_arrow.transform.position = new Vector3(
                   GameCamera.transform.position.x + navarrows_to_render[0].x,
                   1,
                   GameCamera.transform.position.z + navarrows_to_render[0].y);
           navarrows_to_render.Remove(navarrows_to_render[0]);
           new_nav_arrow.SetActive(true);
        }
    }

    public void OnGeoPinButtonClick()
    {
        Debug.Log("geo button clicked");
        string IMUJsonString = TSSc.GetIMUJsonString();
        JsonNode IMUJson = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
        float posx = IMUJson["imu"]["eva1"]["posx"].GetValue<float>();
        float posy = IMUJson["imu"]["eva1"]["posy"].GetValue<float>();

        SendGEOPin(posx, posy, "EVA1 Coords");

        renderGeoPin(posx, posy);
    }

    void SendGEOPin(float x, float y, string desc) {

        DateTime now = DateTime.UtcNow;
        string timestamp = now.ToString("yyyy-MM-ddTHH:mm:ssZ");

        var json = new {
            content = new {
                coords = new { x = x, y = y },
                desc = desc,
            },
            sender = "HMD",
            type = "GEOPIN",
            timestamp = timestamp,
        };

        string jsonString = JsonSerializer.Serialize(json);

        ws.Send(jsonString);

    }

    void SendBreadcrumbs(float x, float y, string desc) {

        DateTime now = DateTime.UtcNow;
        string timestamp = now.ToString("yyyy-MM-ddTHH:mm:ssZ");

        var json = new {
            content = new {
                coords = new { x = x, y = y },
                desc = desc,
            },
            sender = "HMD",
            type = "breadcrumbs",
            timestamp = timestamp,
        };

        string jsonString = JsonSerializer.Serialize(json);

        ws.Send(jsonString);

    }

    void renderGeoPin(float x, float y) {
	Debug.Log("here");   
 
        double mapHeight = 0.1177;
        double mapWidth = 0.11;

        Debug.Log("made active");

        float xfloat = (float)(((x - TOP_LEFT_EASTING) / (BOT_RIGHT_EASTING - TOP_LEFT_EASTING)) * mapHeight - mapHeight * 0.5);
        float yfloat = (float)(((y - TOP_LEFT_NORTHING) / (TOP_LEFT_NORTHING - BOT_RIGHT_NORTHING)) * mapWidth + mapWidth * 0.5);
        float zfloat = 0.001f;

        Debug.Log("computed coords");

        pins_to_render.Add(new Vector3(xfloat, yfloat, zfloat));

        Debug.Log("applied coord transform");
    }



    static double new_x(double x, double y, double EVA_x, double EVA_y, double EVA_Heading){
        double new_x = Math.Cos(-1*EVA_Heading) * (x - EVA_x) - Math.Sin(-1*EVA_Heading) * (y - EVA_y);
        return new_x;
    }

    static double new_y(double x, double y, double EVA_x, double EVA_y, double EVA_Heading){
        double new_y = Math.Sin(-1*EVA_Heading) * (x - EVA_x) + Math.Cos(-1*EVA_Heading) * (y - EVA_y);
        return new_y;
    }

    // Orientation Tranformation
    static double new_Heading(double target_Heading, double EVA_Heading){
        double new_Heading = target_Heading - EVA_Heading;
        if (new_Heading < 0){
            new_Heading += Math.PI * 2; // if heading is negative, add 2pi
        }

        return new_Heading;
    }

    // Not converting to 3 decimal places because might use in calculations 
    public static double degToRad(double degrees){
        return degrees * Math.PI / 180; 
    }

    static double radToDeg(double radians){
        return radians * 180 / Math.PI; 
    }



    void navToCoords(float target_x, float target_y) {
        string IMUJsonString = TSSc.GetIMUJsonString();
        JsonNode IMUJson = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
        double EVA_x = IMUJson["imu"]["eva1"]["posx"].GetValue<double>();
        double EVA_y = IMUJson["imu"]["eva1"]["posy"].GetValue<double>();
        double EVA_Heading = degToRad(IMUJson["imu"]["eva1"]["heading"].GetValue<double>());

        double target_Heading = Math.Atan2(target_y - EVA_y, target_x - EVA_x);

        double newXCoord = new_x(target_x, target_y, EVA_x, EVA_y, EVA_Heading); // newXCoord == meters to the right of the EVA (negative - left of EVA)
        double newYCoord = new_y(target_x, target_y, EVA_x, EVA_y, EVA_Heading); // newYCoord == meters in front of EVA (negative - behind EVA)
        double heading = radToDeg(new_Heading(target_Heading, EVA_Heading)); // heading == counter-clockwise target orientation relative to EVA (0 - facing same direction)

        navarrows_to_render.Add(new Vector3((float) newXCoord, (float) newYCoord, (float) heading));
    }

}
