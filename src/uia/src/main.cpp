#include <iostream>
#include "uia_detection.h"

int main()
{

    cv::VideoCapture cap(0);
    cap.set(cv::CAP_PROP_FRAME_WIDTH, 640);
    cap.set(cv::CAP_PROP_FRAME_HEIGHT, 480);
    std::cout << "Read Frame from Camera" << std::endl;
    cv::Mat frame;
    std::vector<std::vector<cv::Point>> all_sub_points;
    std::vector<cv::Scalar> all_colors;

    loadFeatures();

    while (true)
    {
        cap >> frame;
        all_sub_points.clear();
        all_colors.clear();
        detectUIA(frame, all_sub_points, all_colors);
        for (int i = 0; i < all_sub_points.size(); i++)
        {
            cv::polylines(frame, all_sub_points[i], true, all_colors[i], 3);
        }
        cv::imshow("UIA Detection", frame);
    }

    cap.release();
    cv::destroyAllWindows();

    return 0;
}