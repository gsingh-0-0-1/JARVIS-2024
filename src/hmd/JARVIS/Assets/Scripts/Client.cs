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
    public GameObject StartupInfoObject;
    public Startup startupInfoObjectScript;

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

    public int whoAmI;

    public GameObject navarrowPrefab;
    public GameObject markerPrefab;
    public GameObject mapCanvas;

    public GameObject GameCamera;

    Boolean clearNav = false;

    void Start() {
    }

    public void Start_Custom(String host, String gateway_ip, int player)
    {
        whoAmI = player;
        // startupInfoObjectScript = StartupInfoObject.GetComponent<Startup>();

        //String host = "data.cs.purdue.edu";//startupInfoObjectScript.TSS_ADDR;
        TSSc.ConnectToHost(host, 7);

        //TextAsset gateway = Resources.Load<TextAsset>("gateway");
        //String gateway_ip = gateway.text.Split("\n")[0];
        //String gateway_ip = startupInfoObjectScript.GATEWAY_ADDR;

        Debug.Log("GATEWAY IP " + gateway_ip + "|");

        // TSSc = new TSScConnection();
        ws = new WebSocket("ws://" + gateway_ip + ":4761");
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

            if (tasktype == "CLEARNAV") {
                clearNav = true;        
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
           Vector3 transformedPos = GameCamera.transform.TransformVector(navarrows_to_render[0].x, 0, navarrows_to_render[0].y);
           new_nav_arrow.transform.position = new Vector3(GameCamera.transform.position.x + transformedPos.x, 2.7f, GameCamera.transform.position.z + transformedPos.z);
           //new_nav_arrow.transform.position = new Vector3(
           //        GameCamera.transform.position.x + navarrows_to_render[0].x,
           //        2.5f,
           //        GameCamera.transform.position.z + navarrows_to_render[0].y);
           new_nav_arrow.transform.forward = transformedPos;
           new_nav_arrow.transform.rotation = Quaternion.Euler(90.0f, (float)(Math.Atan2(transformedPos.x, transformedPos.z) * 180 / Math.PI), 0.0f);
           navarrows_to_render.Remove(navarrows_to_render[0]);
           new_nav_arrow.SetActive(true);
           current_navarrows.Add(new_nav_arrow);
        }
    
        if (clearNav) {
            while (current_navarrows.Count() != 0) {
                Destroy(current_navarrows[0]);
                current_navarrows.Remove(current_navarrows[0]);
            }
            clearNav = false;
        }
    }

    public void OnGeoPinButtonClick()
    {
        Debug.Log("geo button clicked");
        string IMUJsonString = TSSc.GetIMUJsonString();
        JsonNode IMUJson = JsonSerializer.Deserialize<JsonNode>(IMUJsonString)!;
        float posx = IMUJson["imu"]["eva" + whoAmI.ToString()]["posx"].GetValue<float>();
        float posy = IMUJson["imu"]["eva" + whoAmI.ToString()]["posy"].GetValue<float>();

        SendGEOPin(posx, posy, "EVA" + whoAmI.ToString() + " Coords");

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
        double EVA_x = IMUJson["imu"]["eva" + whoAmI.ToString()]["posx"].GetValue<double>();
        double EVA_y = IMUJson["imu"]["eva" + whoAmI.ToString()]["posy"].GetValue<double>();
        // the TSS will give heading from -180 to 180, so we need to add 360
        double rawheading = IMUJson["imu"]["eva" + whoAmI.ToString()]["heading"].GetValue<double>();
        //if (rawheading < 0) {
        rawheading = (360 + rawheading) % 360;
        //rawheading = (-rawheading + 90) % 360;
        //}
        double EVA_Heading = degToRad(rawheading);

        // switch x and y due to the orientation of the camera "inside" the map plane


        double target_Heading = 180 * Math.Atan2(target_y - EVA_y, target_x - EVA_x) / Math.PI;
        target_Heading = degToRad((-target_Heading + 90) % 360);

        //Debug.Log("target heading " + radToDeg(target_Heading).ToString());

        //Debug.Log("EVA heading " + radToDeg(EVA_Heading).ToString());

        // since the UTM northing inverts things, I'm just going to flip the EVA heading
        EVA_Heading = 2 * Math.PI - EVA_Heading;

        double newXCoord = new_x(target_x, target_y, EVA_x, EVA_y, EVA_Heading); // newXCoord == meters to the right of the EVA (negative - left of EVA)
        double newYCoord = new_y(target_x, target_y, EVA_x, EVA_y, EVA_Heading); // newYCoord == meters in front of EVA (negative - behind EVA)
        double heading = radToDeg(new_Heading(target_Heading, EVA_Heading)); // heading == counter-clockwise target orientation relative to EVA (0 - facing same direction)

        double dist = Math.Pow(Math.Pow(newXCoord, 2.0) + Math.Pow(newYCoord, 2.0), 0.5);

        int spacing = 5;
 
        for (int i = 1; i < (int)(dist / spacing); i++) {
            Vector3 newVec = new Vector3((float)(i * spacing * newXCoord / dist), (float)(i * spacing * newYCoord / dist), (float) heading);
            //Debug.Log(newVec);
            navarrows_to_render.Add(newVec);
        }

        navarrows_to_render.Add(new Vector3((float) newXCoord, (float) newYCoord, (float) heading));
    }

}
