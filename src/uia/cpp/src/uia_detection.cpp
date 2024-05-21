#include "uia_detection.h"

using json = nlohmann::json;

extern "C" EXPORT void loadFeatures()
{
    // Load the keypoints from the .json file
    std::ifstream keypoints_file("/home/dipam/apurdue/search/unity_packages/UIADetection/Assets/Plugins/x64/keypoints.json");
    json keypoints_json;
    if (keypoints_file.is_open())
    {
        keypoints_file >> keypoints_json;
        keypoints_file.close();
    }
    else
    {
        std::cout << "Unable to open keypoints file." << std::endl;
        return;
    }

    // Load the keypoints into the keypoints_target vector
    for (const auto& kp : keypoints_json)
    {
        // Extracting the x and y values from the first element, which is itself an array.
        float x = kp[0][0].get<float>();
        float y = kp[0][1].get<float>();
        
        // Extracting other properties directly since they are not nested.
        float size = kp[1].get<float>();
        float angle = kp[2].get<float>();
        float response = kp[3].get<float>();
        int octave = kp[4].get<int>();
        int class_id = kp[5].get<int>();

        cv::KeyPoint keypoint(x, y, size, angle, response, octave, class_id);
        keypoints_target.push_back(keypoint);
    }
    
    // Load descriptors
    std::ifstream descriptors_file("/home/dipam/apurdue/search/unity_packages/UIADetection/Assets/Plugins/x64/descriptors.json");
    json descriptors_json;
    if (descriptors_file.is_open())
    {
        descriptors_file >> descriptors_json;
        descriptors_file.close();
    }
    else
    {
        std::cout << "Unable to open descriptors file." << std::endl;
        return;
    }

    // Use the 'descriptors_target' parameter directly instead of redeclaring it
    descriptors_target = cv::Mat(static_cast<int>(descriptors_json.size()), static_cast<int>(descriptors_json.begin()->size()), CV_32F);
    for (size_t i = 0; i < descriptors_json.size(); ++i)
    {
        for (size_t j = 0; j < descriptors_json[i].size(); ++j)
        {
            descriptors_target.at<float>(static_cast<int>(i), static_cast<int>(j)) = descriptors_json[i][j];
        }
    }
    std::cout << "Load Target Image Features" << std::endl;
}

void drawRelativeSubcomponent(cv::Mat& M, std::vector<cv::Point2f>& all_sub_boxes)
{
    for (size_t i = 0; i < SUBCOMPONENTS.size(); ++i)
    {
        // Create Mat from vector of Point2f
        cv::Mat sub_pts_mat = cv::Mat(SUBCOMPONENTS[i]).reshape(2); // Ensuring two columns (x, y)

        // Ensure matrix type is appropriate for perspective transformation
        if (sub_pts_mat.type() != CV_32FC2)
        {
            sub_pts_mat.convertTo(sub_pts_mat, CV_32FC2);
        }

        cv::Mat transformed_sub_pts;
        // Apply perspective transformation
        cv::perspectiveTransform(sub_pts_mat, transformed_sub_pts, M);

        for (int j = 0; j < transformed_sub_pts.rows; j++)
        {
            // Convert back to integer points for drawing
            all_sub_boxes.push_back(cv::Point2f(static_cast<int>(transformed_sub_pts.at<cv::Point2f>(j).x),
                                                static_cast<int>(transformed_sub_pts.at<cv::Point2f>(j).y)));
        }
    }
}

extern "C" EXPORT void detectUIA(unsigned char* frameData, int width, int height, int step, float* outBoundingBoxes, int& numBoxes, float* rotationTranslation, float* camera_matrix, float* dist_coeffs)
{
    frame = cv::Mat(height, width, CV_8UC4, frameData, step);
    cv::cvtColor(frame, frame, cv::COLOR_RGBA2BGR);
    cv::rotate(frame, frame, cv::ROTATE_180);
    // cv::flip(frame, frame, 1);

    if (frame.empty())
    {
        std::cerr << "Error: Frame is empty." << std::endl;
        numBoxes = 0;
        return;
    }

    // Convert frame to grayscale for feature matching
    cv::cvtColor(frame, gray_frame, cv::COLOR_BGR2GRAY);
    
    // Detect keypoints and compute descriptors
    std::vector<cv::KeyPoint> keypoints_frame;
    cv::Mat descriptors_frame;
    orb->detectAndCompute(gray_frame, cv::noArray(), keypoints_frame, descriptors_frame);
    
    // Check if descriptors are found in both target and current frame
    if (descriptors_frame.empty() || descriptors_target.empty())
    {
        std::cerr << "Error: Unable to find descriptors in target or current frame." << std::endl;
        numBoxes = 0;
        return;
    }
    else
    {
        if (descriptors_target.type() != CV_8U)
        {
            descriptors_target.convertTo(descriptors_target, CV_8U);
        }
        if (descriptors_frame.type() != CV_8U)
        {
            descriptors_frame.convertTo(descriptors_frame, CV_8U);
        }

        // Match descriptors
        std::vector<cv::DMatch> matches;
        bf->match(descriptors_target, descriptors_frame, matches);
        std::sort(matches.begin(), matches.end(), [](const cv::DMatch& a, const cv::DMatch& b)
        {
            return a.distance < b.distance;
        });

        std::vector<cv::DMatch> good_matches;
        for (cv::DMatch& match : matches)
        {
            if (match.distance < 50)
            {
                good_matches.push_back(match);
            }
        }

        // Convert the above python cdoe to c++ code
        if (good_matches.size() > 10)
        {
            std::vector<cv::Point2f> source_points;
            std::vector<cv::Point2f> target_points;
            for (cv::DMatch& match : good_matches)
            {
                source_points.push_back(keypoints_target[match.queryIdx].pt);
                target_points.push_back(keypoints_frame[match.trainIdx].pt);
            }
            cv::Mat mask;
            cv::Mat M = cv::findHomography(source_points, target_points, cv::RANSAC, 5.0, mask);

            if (!M.empty() && cv::sum(mask)[0] > 10)
            {
                cv::Mat target_corners = cv::Mat(FULL_UIA).reshape(2);

                // Ensure matrix type is appropriate for perspective transformation
                if (target_corners.type() != CV_32FC2)
                {
                    target_corners.convertTo(target_corners, CV_32FC2);
                }
            
                cv::Mat transformed_corners;
                cv::perspectiveTransform(target_corners, transformed_corners, M);

                std::vector<cv::Point2f> boxes;
                drawRelativeSubcomponent(M, boxes);
                numBoxes = static_cast<int>(boxes.size()) / 4;

                for (int i = 0; i < numBoxes; ++i)
                {
                    int idx = i * 4;
                    int idx2 = i * 8;
                    outBoundingBoxes[idx2] = boxes[idx].x;
                    outBoundingBoxes[idx2 + 1] = boxes[idx].y;
                    outBoundingBoxes[idx2 + 2] = boxes[idx + 1].x;
                    outBoundingBoxes[idx2 + 3] = boxes[idx + 1].y;
                    outBoundingBoxes[idx2 + 4] = boxes[idx + 2].x;
                    outBoundingBoxes[idx2 + 5] = boxes[idx + 2].y;
                    outBoundingBoxes[idx2 + 6] = boxes[idx + 3].x;
                    outBoundingBoxes[idx2 + 7] = boxes[idx + 3].y;
                }

                // Converting source_points to objp (object points in 3D)
                std::vector<cv::Point3f> objp;
                for (size_t i = 0; i < source_points.size(); ++i) {
                    // Check if the point is an inlier
                    if (mask.at<uchar>(i) == 1) {
                        float x = source_points[i].x / WIDTH * REAL_WIDTH;
                        float y = source_points[i].y / HEIGHT * REAL_HEIGHT;
                        objp.push_back(cv::Point3f(x, y, 0));
                    }
                }

                // Converting target_points to points (image points in 2D)
                std::vector<cv::Point2f> points;
                for (size_t i = 0; i < target_points.size(); ++i) {
                    // Check if the point is an inlier
                    if (mask.at<uchar>(i) == 1) {
                        points.push_back(cv::Point2f(target_points[i].x, target_points[i].y));
                    }
                }

                // Solve PnP
                cv::Mat rvec, tvec;
                cv::Mat matrix = cv::Mat(3, 3, CV_32F, camera_matrix);
                cv::Mat dist = cv::Mat(5, 1, CV_32F, dist_coeffs);
                cv::solvePnPRansac(objp, points, matrix, dist, rvec, tvec, false, cv::SOLVEPNP_ITERATIVE);

                rotationTranslation[0] = rvec.at<double>(0);
                rotationTranslation[1] = rvec.at<double>(1);
                rotationTranslation[2] = rvec.at<double>(2);
                rotationTranslation[3] = tvec.at<double>(0);
                rotationTranslation[4] = tvec.at<double>(1);
                rotationTranslation[5] = tvec.at<double>(2);
            }
        }
    }
}