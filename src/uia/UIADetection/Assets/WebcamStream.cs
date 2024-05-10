using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.UI;

public class WebcamStream : MonoBehaviour
{
    public RawImage videoDisplay;
    private WebCamTexture webCamTexture;
    public GameObject lineRendererPrefab;
    private List<GameObject> activeBoundingBoxes = new List<GameObject>();

    // List of all components based on the provided IDs
    string[] subComponents = new string[]
    {
        "eva1_power", "eva1_oxy", "eva1_water_supply", "eva1_water_waste",
        "eva2_power", "eva2_oxy", "eva2_water_supply", "eva2_water_waste",
        "oxy_vent", "depress"
    };

    [DllImport("uia_detection", EntryPoint = "loadFeatures", CallingConvention = CallingConvention.Cdecl)]
    private static extern void loadFeatures();
    [DllImport("uia_detection", EntryPoint = "detectUIA", CallingConvention = CallingConvention.Cdecl)]
    private static extern void detectUIA(IntPtr frameData, int width, int height, int step, float[] outBoundingBoxes, ref int numBoxes);

    void Start()
    {
        loadFeatures();
        Debug.Log("Load Features Done");
        StartWebCamTexture();
    }

    void StartWebCamTexture()
    {
        if (WebCamTexture.devices.Length > 0)
        {
            webCamTexture = new WebCamTexture();
            videoDisplay.texture = webCamTexture;
            webCamTexture.Play();
        }
        else
        {
            Debug.LogError("No webcam found.");
        }
    }

    void Update()
    {
        if (webCamTexture.didUpdateThisFrame && webCamTexture.isPlaying)
        {
            ProcessFrame(webCamTexture);
        }
    }

    private void ProcessFrame(WebCamTexture texture)
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
            
            detectUIA(pixelPtr, width, height, step, boundingBoxes, ref numBoxes);

            Array.Resize(ref boundingBoxes, numBoxes * 8);

            UpdateBoundingBoxes(boundingBoxes, numBoxes);
        }
        finally
        {
            pixelHandle.Free();
        }
    }

    private void UpdateBoundingBoxes(float[] boxes, int numBoxes)
    {
        ClearBoundingBoxes();

        // Scale factors from texture to UI
        float scaleX = videoDisplay.rectTransform.rect.width / webCamTexture.width;
        float scaleY = videoDisplay.rectTransform.rect.height / webCamTexture.height;

        for (int i = 0; i < numBoxes; i++)
        {
            // Get the coordinates of the bounding box - x1, y1, x2, y2, x3, y3, x4, y4
            int idx = i * 8;
            float x1 = boxes[idx] * scaleX;
            float y1 = boxes[idx + 1] * scaleY;
            float x2 = boxes[idx + 2] * scaleX;
            float y2 = boxes[idx + 3] * scaleY;
            float x3 = boxes[idx + 4] * scaleX;
            float y3 = boxes[idx + 5] * scaleY;
            float x4 = boxes[idx + 6] * scaleX;
            float y4 = boxes[idx + 7] * scaleY;

            // Create a new line renderer object
            GameObject box = Instantiate(lineRendererPrefab, videoDisplay.transform);
            LineRenderer lineRenderer = box.GetComponent<LineRenderer>();

            // Set the positions of the line renderer
            lineRenderer.positionCount = 5;
            lineRenderer.SetPosition(0, new Vector3(x1, y1, 0));
            lineRenderer.SetPosition(1, new Vector3(x2, y2, 0));
            lineRenderer.SetPosition(2, new Vector3(x3, y3, 0));
            lineRenderer.SetPosition(3, new Vector3(x4, y4, 0));
            lineRenderer.SetPosition(4, new Vector3(x1, y1, 0));

            activeBoundingBoxes.Add(box);

            // Draw the bounding box
            box.SetActive(true);
        }
    }

    private void ClearBoundingBoxes()
    {
        foreach (var box in activeBoundingBoxes)
        {
            Destroy(box);
        }
        activeBoundingBoxes.Clear();
    }

    void OnDestroy()
    {
        if (webCamTexture != null)
        {
            webCamTexture.Stop();
            Destroy(webCamTexture);
        }
        ClearBoundingBoxes();
    }
}