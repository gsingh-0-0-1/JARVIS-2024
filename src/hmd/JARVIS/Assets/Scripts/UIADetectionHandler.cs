using System;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Linq;
using WebSocketSharp;
using System.Text.Json;
using System.Text.Json.Nodes;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Windows.WebCam;
using TMPro;
// using UnityEditor.AssetImporters;
using Unity.XR.CoreUtils;
//using Newtonsoft.Json;

public class UIADetectionHandler : MonoBehaviour
{
    public TSScConnection TSSc;

    public RawImage videoDisplay;
    public WebCamTexture webCamTexture = null;


    private List<GameObject> activeBoundingBoxes = new List<GameObject>();
    private VideoCapture videoCapture = null;
    private Texture2D photoTexture = null;

    public GameObject UIAFrame;
    public GameObject GameCamera;

    public TMP_Text taskPanelText;

    Boolean renderUIA = false;
    Boolean frame_to_proc = false;
    Boolean play_texture = false;

    Boolean activateUIA = false;
    Boolean deActivateUIA = false;

    Boolean UIAIsActive = false;

    int nframes_max = 3;
    int nframes_done = 0;

    int screenWidth = 1952;
    int screenHeight = 1100;

    float[] outerCorners = new float[8];

    public float[] rotationTranslation = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f};
    public float[] dist_coeffs = { 0.0f, 0.0f, 0.0f, 0.0f, 0.0f};

    WebSocket ws;


    public GameObject BBOX_EVA1_POWER_G;
    public GameObject BBOX_EVA1_POWER_R;

    public GameObject BBOX_EVA1_OXY_G;
    public GameObject BBOX_EVA1_OXY_R;

    public GameObject BBOX_EVA1_SUPPLY_G;
    public GameObject BBOX_EVA1_SUPPLY_R;

    public GameObject BBOX_EVA1_WASTE_G;
    public GameObject BBOX_EVA1_WASTE_R;

    public GameObject BBOX_EVA2_POWER_G;
    public GameObject BBOX_EVA2_POWER_R;

    public GameObject BBOX_EVA2_OXY_G;
    public GameObject BBOX_EVA2_OXY_R;

    public GameObject BBOX_EVA2_SUPPLY_G;
    public GameObject BBOX_EVA2_SUPPLY_R;

    public GameObject BBOX_EVA2_WASTE_G;
    public GameObject BBOX_EVA2_WASTE_R;

    public GameObject BBOX_VENT_G;
    public GameObject BBOX_VENT_R;

    public GameObject BBOX_DEPRESS_G;
    public GameObject BBOX_DEPRESS_R;

    private PhotoCapture photoCaptureObject = null;

    string[] subComponents = new string[]
    {
        "eva1_power", "eva1_oxy", "eva1_water_supply", "eva1_water_waste",
        "eva2_power", "eva2_oxy", "eva2_water_supply", "eva2_water_waste",
        "oxy_vent", "depress"
    };



    [DllImport("UIADetect", EntryPoint = "loadFeatures", CallingConvention = CallingConvention.Cdecl)]
    private static extern int loadFeatures(String keypoints_str, String descriptors_str);
    
    [DllImport("UIADetect", EntryPoint = "detectUIA", CallingConvention = CallingConvention.Cdecl)]
    //unsigned char* frameData, int width, int height, int step, float* outBoundingBoxes, int& numBoxes, float* rotationTranslation, float* camera_matrix, float* dist_coeffs
    private static extern void detectUIA(IntPtr frameData, int width, int height, int step, float[] outBoundingBoxes, ref int numBoxes, float[] rotationTranlation, float[] camera_matrix, float[] dist_coeffs);
    
    //[DllImport("UIADetect", EntryPoint = "testFunc", CallingConvention = CallingConvention.Cdecl)]
    //private static extern int testFunc(int n);

    public void Start_Custom(String host, String gateway_ip)
    {
        // TextAsset gateway = Resources.Load<TextAsset>("gateway");
        // String gateway_ip = gateway.text.Split("\n")[0];

        // Debug.Log("GATEWAY IP " + gateway_ip + "|");

        // TSSc = new TSScConnection();
        TSSc.ConnectToHost(host, 7);

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

            if (tasktype == "UIA_ON")
            {
                // StartWebCamTexture();
                play_texture = true;
                frame_to_proc = true;
                activateUIA = true;
                UIAIsActive = true;
                // webCamTexture.Play();
                // UIAFrame.SetActive(true);
            }

            if (tasktype == "UIA_OFF")
            {
                renderUIA = false;
                deActivateUIA = true;
                UIAIsActive = false;
                // UIAFrame.SetActive(false);
            }
        };

        // taskPanelText.SetText("loading object info");

        TextAsset keypoints = Resources.Load<TextAsset>("keypoints");
        TextAsset descriptors = Resources.Load<TextAsset>("descriptors");

        // taskPanelText.SetText("feature files loaded");

        try
        {
            loadFeatures(keypoints.text.ToString(), descriptors.text.ToString());
        }
        catch (Exception e)
        {
            Debug.Log(e.Message);
        }

        StartWebCamTexture();

        // handle the permissions dialog the first time the app is run
        // webCamTexture.Play();
        // webCamTexture.Stop();

        StartCoroutine(LoopedBBoxUpdate());
    }

    void StartWebCamTexture()
    {
        PhotoCapture.CreateAsync(false, OnPhotoCaptureCreated);
    }

    private void OnPhotoCaptureCreated(PhotoCapture captureObject)
    {
        photoCaptureObject = captureObject;

        Resolution cameraResolution = PhotoCapture.SupportedResolutions.OrderByDescending((res) => res.width * res.height).First();

        CameraParameters c = new CameraParameters();
        c.hologramOpacity = 0.0f;
        c.cameraResolutionWidth = cameraResolution.width;
        c.cameraResolutionHeight = cameraResolution.height;
        c.pixelFormat = CapturePixelFormat.BGRA32;
        photoTexture = new Texture2D(cameraResolution.width, cameraResolution.height, TextureFormat.BGRA32, false);

        captureObject.StartPhotoModeAsync(c, OnPhotoModeStarted);
    }

    private void OnPhotoModeStarted(PhotoCapture.PhotoCaptureResult result)
    {
        if (!result.success)
        {
            Debug.LogError("Unable to start photos!");
        }
    }

    private void OnCaptured(PhotoCapture.PhotoCaptureResult result, PhotoCaptureFrame frame)
    {
        if (!result.success)
        {
            taskPanelText.SetText("photo failed");
        }
        if (result.success && frame != null)
        {
            //if (UIAIsActive) { 
            frame.UploadImageDataToTexture(photoTexture);

            taskPanelText.SetText("uploaded texture");

            Matrix4x4 cameraToWorldMatrix;
            frame.TryGetCameraToWorldMatrix(out cameraToWorldMatrix);

            taskPanelText.SetText("got matrix");

            Matrix4x4 projectionMatrix;
            frame.TryGetProjectionMatrix(out projectionMatrix);

            taskPanelText.SetText("got proj matrix");

            ProcessFrame(photoTexture, cameraToWorldMatrix, taskPanelText);

            //taskPanelText.SetText(rotationTranslation[3].ToString() + " " + rotationTranslation[4].ToString() + " " + rotationTranslation[5].ToString());



            // Position the canvas object slightly in front
            // of the real world web camera.

            Vector3 translation = new Vector3(rotationTranslation[3], rotationTranslation[4], rotationTranslation[5]);
            Quaternion rotation = Quaternion.Euler(180.0f * rotationTranslation[0] / (float)Math.PI, 
                180.0f * rotationTranslation[1] / (float)Math.PI, 
                180.0f * rotationTranslation[2] / (float)Math.PI);

            //cameraToWorldMatrix.GetColumn(3);
            //Vector3 forward = cameraToWorldMatrix.GetColumn(2);


            //Vector3 position = translation + forward * ((float)UIADistance);

            // Rotate the canvas object so that it faces the user.
            //Quaternion rotation = Quaternion.LookRotation(-cameraToWorldMatrix.GetColumn(2), cameraToWorldMatrix.GetColumn(1));

            UIAFrame.transform.position = GameCamera.transform.TransformPoint(translation);
            UIAFrame.transform.rotation = rotation;
            //UIAFrame.transform.rotation = Quaternion.LookRotation(-cameraToWorldMatrix.GetColumn(2), cameraToWorldMatrix.GetColumn(1));
            

            //}
        }
    }

    void Update()
    {
        /* if (webCamTexture == null) {
             return;
         }
         if (play_texture) {
             webCamTexture.Play();
             play_texture = false;
             screenWidth = webCamTexture.width;
             screenHeight = webCamTexture.height;
         }

         if (webCamTexture.didUpdateThisFrame && webCamTexture.isPlaying && frame_to_proc)
         {
             // Debug.Log("proc");
             ProcessFrame(webCamTexture);
             if (nframes_done > nframes_max) {
                 nframes_done = 0;
                 frame_to_proc = false;
                 webCamTexture.Stop();
             }
             nframes_done = nframes_done + 1;
             // webCamTexture.Stop();
         }*/

        if (UIAIsActive)
        {
            //photoCaptureObject.TakePhotoAsync(OnCaptured);
        }
        if (activateUIA)
        {
            UIAFrame.SetActive(true);
            activateUIA = false;
            photoCaptureObject.TakePhotoAsync(OnCaptured);
        }
        if (deActivateUIA)
        {
            UIAFrame.SetActive(false);
            deActivateUIA = false;
        }
    }

    IEnumerator LoopedBBoxUpdate()
    {
        while (true)
        {
            yield return new WaitForSeconds(0.25f);
            if (UIAIsActive)
            {
                yield return StartCoroutine(updateBoundingBoxStates());
            }
        }
    }

    IEnumerator updateBoundingBoxStates()
    {
        string UIAJsonString = TSSc.GetUIAJsonString();
        JsonNode UIAJson = JsonSerializer.Deserialize<JsonNode>(UIAJsonString)!;

        BBOX_EVA1_POWER_G.SetActive(UIAJson["uia"]["eva1_power"].GetValue<Boolean>());
        BBOX_EVA1_POWER_R.SetActive(!UIAJson["uia"]["eva1_power"].GetValue<Boolean>());

        BBOX_EVA1_OXY_G.SetActive(UIAJson["uia"]["eva1_oxy"].GetValue<Boolean>());
        BBOX_EVA1_OXY_R.SetActive(!UIAJson["uia"]["eva1_oxy"].GetValue<Boolean>());

        BBOX_EVA1_SUPPLY_G.SetActive(UIAJson["uia"]["eva1_water_supply"].GetValue<Boolean>());
        BBOX_EVA1_SUPPLY_R.SetActive(!UIAJson["uia"]["eva1_water_supply"].GetValue<Boolean>());

        BBOX_EVA1_WASTE_G.SetActive(UIAJson["uia"]["eva1_water_waste"].GetValue<Boolean>());
        BBOX_EVA1_WASTE_R.SetActive(!UIAJson["uia"]["eva1_water_waste"].GetValue<Boolean>());


        BBOX_EVA2_POWER_G.SetActive(UIAJson["uia"]["eva2_power"].GetValue<Boolean>());
        BBOX_EVA2_POWER_R.SetActive(!UIAJson["uia"]["eva2_power"].GetValue<Boolean>());

        BBOX_EVA2_OXY_G.SetActive(UIAJson["uia"]["eva2_oxy"].GetValue<Boolean>());
        BBOX_EVA2_OXY_R.SetActive(!UIAJson["uia"]["eva2_oxy"].GetValue<Boolean>());

        BBOX_EVA2_SUPPLY_G.SetActive(UIAJson["uia"]["eva2_water_supply"].GetValue<Boolean>());
        BBOX_EVA2_SUPPLY_R.SetActive(!UIAJson["uia"]["eva2_water_supply"].GetValue<Boolean>());

        BBOX_EVA2_WASTE_G.SetActive(UIAJson["uia"]["eva2_water_waste"].GetValue<Boolean>());
        BBOX_EVA2_WASTE_R.SetActive(!UIAJson["uia"]["eva2_water_waste"].GetValue<Boolean>());


        BBOX_VENT_G.SetActive(UIAJson["uia"]["oxy_vent"].GetValue<Boolean>());
        BBOX_VENT_R.SetActive(!UIAJson["uia"]["oxy_vent"].GetValue<Boolean>());

        BBOX_DEPRESS_G.SetActive(UIAJson["uia"]["depress"].GetValue<Boolean>());
        BBOX_DEPRESS_R.SetActive(!UIAJson["uia"]["depress"].GetValue<Boolean>());

        yield break;
    }

    private double ProcessFrame(Texture2D texture, Matrix4x4 projMatrix, TMP_Text taskPanelText)
    {
        Color32[] pixels = texture.GetPixels32();
        GCHandle pixelHandle = GCHandle.Alloc(pixels, GCHandleType.Pinned);
        IntPtr pixelPtr = pixelHandle.AddrOfPinnedObject();

        // Calculate step
        int width = texture.width;
        int height = texture.height;
        int step = width * 4;


        try
        {
            int numBoxes = 0;
            int maxExpectedBoxes = 10;
            float[] boundingBoxes = new float[maxExpectedBoxes * 8];        // 8 coordinates per box * 10 bounding boxes

            float[] outerCorners = new float[8];
            float[] projMatrixFloat = new float[16];

            for (int i = 0; i < 4; i++)
            {
                for (int j = 0; j < 4; j++)
                {
                    projMatrixFloat[i * 4 + j] = projMatrix[i, j];
                }
            }

            //detectUIA(pixelPtr, texture.width, texture.height, step, boundingBoxes, outerCorners, ref numBoxes);


            try
            {
                detectUIA(pixelPtr, texture.width, texture.height, step, boundingBoxes, ref numBoxes, rotationTranslation, projMatrixFloat, dist_coeffs);
            }
            catch (Exception e)
            {
                taskPanelText.SetText(e.Message);
                // Debug.Log("TEST " + testFunc(10).ToString() + " NB " + numBoxes.ToString());
            }

            /*
            String outString = "";

            outString = outString + "(" + outerCorners[0].ToString() + ", " + outerCorners[1].ToString() + "), ";
            outString = outString + "(" + outerCorners[2].ToString() + ", " + outerCorners[3].ToString() + "), ";
            outString = outString + "(" + outerCorners[4].ToString() + ", " + outerCorners[5].ToString() + "), ";
            outString = outString + "(" + outerCorners[6].ToString() + ", " + outerCorners[7].ToString() + "), ";

            //for (int i = 0; i < numBoxes; i++) {
            //    outString = outString + ("Box " + (i + 1).ToString() + " Corner1: (" + boundingBoxes[i * 8].ToString() + ", " + boundingBoxes[i * 8 + 1].ToString() + "), ");
            //    outString = outString + ("Box " + (i + 1).ToString() + " Corner2: (" + boundingBoxes[i * 8 + 2].ToString() + ", " + boundingBoxes[i * 8 + 3].ToString() + "), ");
            //    outString = outString + ("Box " + (i + 1).ToString() + " Corner3: (" + boundingBoxes[i * 8 + 4].ToString() + ", " + boundingBoxes[i * 8 + 5].ToString() + "), ");
            //    outString = outString + ("Box " + (i + 1).ToString() + " Corner4: (" + boundingBoxes[i * 8 + 6].ToString() + ", " + boundingBoxes[i * 8 + 7].ToString() + "), ");
            //}

            outString = "{\"type\" : \"bbinfo\" , \"content\" : \"" + outString + "\"}";

            ws.Send(outString);
            Debug.Log("OUTER BOUNDING BOX");
            Debug.Log(outString);
            Array.Resize(ref boundingBoxes, numBoxes * 8);

            renderUIA = true;

            screenWidth = photoTexture.width;
            screenHeight = photoTexture.height;

            double UIACenterScreenX = (outerCorners[0] + outerCorners[2] + outerCorners[4] + outerCorners[6]) / 4.0;
            double UIACenterScreenY = (outerCorners[1] + outerCorners[3] + outerCorners[5] + outerCorners[7]) / 4.0;

            double modScreenX = -1 * (UIACenterScreenX - (screenWidth / 2));
            double modScreenY = 1 * (UIACenterScreenY - (screenHeight / 2));

            // the first point (idxs 0 and 1) in outerFrame is the transformed (0, 0) point
            // the second point (idxs 2 and 3) is the transformed (0, H) point
            double approxUIAPixelHeight = Math.Pow(Math.Pow(outerCorners[2] - outerCorners[0], 2.0) + Math.Pow(outerCorners[3] - outerCorners[1], 2.0), 0.5);

            // the fourth and last point (idxs 6 and 7) is the transformed (W, 0) point
            double approxUIAPixelWidth = Math.Pow(Math.Pow(outerCorners[6] - outerCorners[0], 2.0) + Math.Pow(outerCorners[7] - outerCorners[1], 2.0), 0.5);

            if (approxUIAPixelWidth < 1)
            {
                pixelHandle.Free();
                return -1.0;
            }

            // Debug.Log(approxUIAPixelHeight.ToString() + " " + approxUIAPixelWidth.ToString());

            // in meters, CHANGE THIS LATER
            double realUIAWidth = 0.145;
            double realUIAHeight = 0.163;

            // degrees
            double HL2_FOV_hor = 64.69;
            double HL2_FOV_ver = 29.0;

            double expectedUIAPixelWidth = screenWidth * (realUIAWidth / (2 * Math.PI * 1)) / (HL2_FOV_hor / 360);
            double expectedUIAPixelHeight = screenHeight * (realUIAHeight / (2 * Math.PI * 1)) / (HL2_FOV_ver / 360);

            double UIADistance = 1 * (expectedUIAPixelWidth / approxUIAPixelWidth);

            double verticalAngleOffset = 180 * Math.Atan2((expectedUIAPixelHeight * 1), (approxUIAPixelHeight * UIADistance)) / Math.PI;//HL2_FOV_ver * (modScreenY / screenHeight);

            Vector3 translation = projMatrix.GetColumn(3);
            Vector3 forward = projMatrix.GetColumn(2);

            Vector3 forwardOrthogonal = new Vector3(-forward.z, 0, forward.x);
            forwardOrthogonal.Normalize();

            Quaternion rotation = Quaternion.AngleAxis((float)verticalAngleOffset, forwardOrthogonal);

            Vector3 UIADirectionVec = rotation * forward;

            Vector3 relativePos = new Vector3((float)(UIADistance * UIADirectionVec.x / UIADirectionVec.magnitude),
                                          (float)(UIADistance * UIADirectionVec.y / UIADirectionVec.magnitude),
                                          (float)(UIADistance * UIADirectionVec.z / UIADirectionVec.magnitude)
                                          );

            UIAFrame.transform.position = relativePos + translation;
            UIAFrame.transform.forward = new Vector3(forward.x, 0, forward.z);

            pixelHandle.Free();
            return UIADistance;

            //UpdateBoundingBoxes(outerCorners);
            */
        }
        finally
        {
            //pixelHandle.Free();
        }

        return -1.0;
    }


    private void UpdateBoundingBoxes(float[] outerFrame)
    {
        screenWidth = photoTexture.width;
        screenHeight = photoTexture.height;

        double UIACenterScreenX = (outerFrame[0] + outerFrame[2] + outerFrame[4] + outerFrame[6]) / 4.0;
        double UIACenterScreenY = (outerFrame[1] + outerFrame[3] + outerFrame[5] + outerFrame[7]) / 4.0;

        double modScreenX = -1 * (UIACenterScreenX - (screenWidth / 2));
        double modScreenY = 1 * (UIACenterScreenY - (screenHeight / 2));

        // the first point (idxs 0 and 1) in outerFrame is the transformed (0, 0) point
        // the second point (idxs 2 and 3) is the transformed (0, H) point
        double approxUIAPixelHeight = Math.Pow(Math.Pow(outerFrame[2] - outerFrame[0], 2.0) + Math.Pow(outerFrame[3] - outerFrame[1], 2.0), 0.5);

        // the fourth and last point (idxs 6 and 7) is the transformed (W, 0) point
        double approxUIAPixelWidth = Math.Pow(Math.Pow(outerFrame[6] - outerFrame[0], 2.0) + Math.Pow(outerFrame[7] - outerFrame[1], 2.0), 0.5);

        if (approxUIAPixelWidth < 1)
        {
            return;
        }

        // Debug.Log(approxUIAPixelHeight.ToString() + " " + approxUIAPixelWidth.ToString());

        // in meters, CHANGE THIS LATER
        double realUIAWidth = 0.53;
        double realUIAHeight = 0.61;

        // degrees
        double HL2_FOV_hor = 64.69;
        double HL2_FOV_ver = 29.0;



        double expectedUIAPixelWidth = screenWidth * (realUIAWidth / (2 * Math.PI * 1)) / (HL2_FOV_hor / 360);
        double expectedUIAPixelHeight = screenHeight * (realUIAHeight / (2 * Math.PI * 1)) / (HL2_FOV_ver / 360);

        double UIADistance = 1 * (expectedUIAPixelWidth / approxUIAPixelWidth);

        // taskPanelText.SetText(webCamTexture.width.ToString() + " " + screenWidth.ToString() + " " + Convert.ToInt32(expectedUIAPixelWidth).ToString() + " " + Convert.ToInt32(approxUIAPixelWidth).ToString() + " " + UIADistance.ToString());

        double verticalAngleOffset = Math.Atan2((expectedUIAPixelHeight * 1), (approxUIAPixelHeight * UIADistance));//HL2_FOV_ver * (modScreenY / screenHeight);

        //taskPanelText.SetText(Convert.ToInt32(expectedUIAPixelWidth).ToString() + " " + Convert.ToInt32(approxUIAPixelHeight).ToString());

        // let's find the vector in the x-z plane that is perpendicular to the forward
        Vector3 forwardOrthogonal = new Vector3(-GameCamera.transform.forward.z, 0, GameCamera.transform.forward.x);
        forwardOrthogonal.Normalize();

        Quaternion rotation = Quaternion.AngleAxis((float)verticalAngleOffset, forwardOrthogonal);

        // now we can rotate the camera's forward vector by verticalAngleOffset around this axis

        Vector3 UIADirectionVec = rotation * GameCamera.transform.forward;

        Vector3 relativePos = new Vector3((float)(UIADistance * UIADirectionVec.x / UIADirectionVec.magnitude),
                                          (float)(UIADistance * UIADirectionVec.y / UIADirectionVec.magnitude),
                                          (float)(UIADistance * UIADirectionVec.z / UIADirectionVec.magnitude)
                                          );

        //Vector3 relativePos = new Vector3((float)(UIADistance * GameCamera.transform.forward.x / GameCamera.transform.forward.magnitude),
        //                                  (float)(UIADistance * GameCamera.transform.forward.y / GameCamera.transform.forward.magnitude),
        //                                  (float)(UIADistance * GameCamera.transform.forward.z / GameCamera.transform.forward.magnitude)
        //                                  );

        UIAFrame.transform.position = relativePos + GameCamera.transform.position;
        UIAFrame.transform.forward = new Vector3(GameCamera.transform.forward.x, 0, GameCamera.transform.forward.z);
        // UIAFrame.SetActive(true);

    }


    private void ClearBoundingBoxes()
    {
        foreach (var box in activeBoundingBoxes)
        {
            Destroy(box);
        }
        activeBoundingBoxes.Clear();
    }

    /*
    void OnDestroy()
    {
        if (webCamTexture != null)
        {
            webCamTexture.Stop();
            Destroy(webCamTexture);
        }
        ClearBoundingBoxes();
    }
    */
}
