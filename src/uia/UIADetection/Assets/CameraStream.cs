using UnityEngine;
using System.Collections;
using UnityEngine.Windows.WebCam;

public class CameraStream : MonoBehaviour
{
    // public Renderer videoRenderer;
    public RawImage videoRenderer;
    private VideoCapture videoCapture = null;

    void Start()
    {
        StartVideoCapture();
    }

    void StartVideoCapture()
    {
        VideoCapture.CreateAsync(false, (captureObject) =>
        {
            videoCapture = captureObject;
            StartVideoMode();
        });
    }

    void StartVideoMode()
    {
        Resolution cameraResolution = VideoCapture.SupportedResolutions[0];
        float framerate = VideoCapture.GetSupportedFrameRatesForResolution(cameraResolution)[0];

        CameraParameters cameraParameters = new CameraParameters
        {
            hologramOpacity = 0.0f,
            cameraResolutionWidth = cameraResolution.width,
            cameraResolutionHeight = cameraResolution.height,
            frameRate = framerate,
            pixelFormat = CapturePixelFormat.BGRA32
        };

        videoCapture.StartVideoModeAsync(cameraParameters,
                                         VideoCapture.AudioState.None,
                                         OnStartedVideoMode);
    }

    void OnStartedVideoMode(VideoCapture.VideoCaptureResult result)
    {
        if (result.success)
        {
            videoCapture.StartRecordingVideoToTexture((videoTexture) =>
            {
                if (videoRenderer != null)
                {
                    videoRenderer.material.mainTexture = videoTexture;
                }
            });
        }
        else
        {
            Debug.LogError("Unable to start video mode.");
        }
    }

    void OnDestroy()
    {
        if (videoCapture != null)
        {
            videoCapture.StopVideoModeAsync(OnStoppedVideoMode);
        }
    }

    void OnStoppedVideoMode(VideoCapture.VideoCaptureResult result)
    {
        videoCapture.Dispose();
        videoCapture = null;
    }
}