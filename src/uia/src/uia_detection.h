#ifndef UIA_DETECTION_H
#define UIA_DETECTION_H

#include <iostream>
#include <fstream>
#include <vector>
#include <string>

#include <opencv2/opencv.hpp>
#include <curl/curl.h>
#include </usr/include/nlohmann/json.hpp>

// Define the EXPORT macro depending on the compiler
#if defined _WIN32 || defined __CYGWIN__
    #define EXPORT __declspec(dllexport)
#else
    #define EXPORT
#endif

#ifdef __cplusplus
extern "C" {
#endif
    EXPORT void loadFeatures();
    EXPORT void detectUIA(cv::Mat frame, std::vector<std::vector<cv::Point>>& all_sub_points, std::vector<cv::Scalar>& all_colors);
#ifdef __cplusplus
}
#endif

#endif // UIA_DETECTION_H