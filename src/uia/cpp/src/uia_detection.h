#ifndef UIA_DETECTION_H
#define UIA_DETECTION_H

#include <iostream>
#include <fstream>
#include <vector>
#include <string>

#include <opencv2/opencv.hpp>
#include <curl/curl.h>
#include </usr/include/nlohmann/json.hpp>

int NUM_FEATURES = 2000;     // Increase nfeatures to increase accuracy (default: 500)
int HEIGHT = 883;
int WIDTH = 756;

// Position of subcomponents in the target image anti-clockwise from top-left
std::vector<cv::Point2f> EMU1_POWER =   {cv::Point2f(34, 248), cv::Point2f(34, 419), cv::Point2f(116, 419), cv::Point2f(116, 248)};
std::vector<cv::Point2f> EV1_SUPPLY =   {cv::Point2f(116, 218), cv::Point2f(116, 419), cv::Point2f(224, 419), cv::Point2f(224, 218)};
std::vector<cv::Point2f> EV1_WASTE =    {cv::Point2f(224, 218), cv::Point2f(224, 419), cv::Point2f(331, 419), cv::Point2f(331, 218)};
std::vector<cv::Point2f> EV1_OXYGEN =   {cv::Point2f(250, 443), cv::Point2f(250, 637), cv::Point2f(331, 637), cv::Point2f(331, 443)};
std::vector<cv::Point2f> O2_VENT =      {cv::Point2f(266, 637), cv::Point2f(266, 838), cv::Point2f(353, 838), cv::Point2f(353, 637)};
std::vector<cv::Point2f> EMU2_POWER =   {cv::Point2f(638, 248), cv::Point2f(638, 419), cv::Point2f(719, 419), cv::Point2f(719, 248)};
std::vector<cv::Point2f> EV2_SUPPLY =   {cv::Point2f(420, 218), cv::Point2f(420, 419), cv::Point2f(531, 419), cv::Point2f(531, 218)};
std::vector<cv::Point2f> EV2_WASTE =    {cv::Point2f(531, 218), cv::Point2f(531, 419), cv::Point2f(638, 419), cv::Point2f(638, 218)};
std::vector<cv::Point2f> EV2_OXYGEN =   {cv::Point2f(425, 443), cv::Point2f(425, 637), cv::Point2f(501, 637), cv::Point2f(501, 443)};
std::vector<cv::Point2f> DEPRESS_PUMP = {cv::Point2f(366, 644), cv::Point2f(366, 768), cv::Point2f(508, 768), cv::Point2f(508, 644)};
std::vector<cv::Point2f> FULL_UIA =     {cv::Point2f(0, 0), cv::Point2f(0, HEIGHT), cv::Point2f(WIDTH, HEIGHT), cv::Point2f(WIDTH, 0)};
std::vector<std::vector<cv::Point2f>> SUBCOMPONENTS = {EMU1_POWER, EV1_OXYGEN, EV1_SUPPLY, EV1_WASTE, EMU2_POWER, EV2_OXYGEN, EV2_SUPPLY, EV2_WASTE, O2_VENT, DEPRESS_PUMP};

cv::Mat frame, gray_frame;
std::vector<cv::KeyPoint> keypoints_target;
cv::Mat descriptors_target;
cv::Ptr<cv::ORB> orb = cv::ORB::create(NUM_FEATURES);
cv::Ptr<cv::BFMatcher> bf = cv::BFMatcher::create(cv::NORM_HAMMING, true);

// Define the EXPORT macro depending on the compiler
#if defined _WIN32 || defined __CYGWIN__
    #define EXPORT __declspec(dllexport)
#else
    #define EXPORT __attribute__((visibility("default")))
#endif

#ifdef __cplusplus
extern "C" {
#endif
    EXPORT void loadFeatures();
    EXPORT void detectUIA(unsigned char* frameData, int width, int height, int step, float* outBoundingBoxes, int& numBoxes);
#ifdef __cplusplus
}
#endif

#endif // UIA_DETECTION_H