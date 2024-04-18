#include "uia_detection.h"

using json = nlohmann::json;

// Function prototypes
static size_t WriteCallback(void* buffer, size_t size, size_t nmemb, void* userp);
std::string HttpGet(const std::string& url);
json fetchStates();
void drawRelativeSubcomponent(cv::Mat& frame, cv::Mat& M, json& subcomponents_states, std::vector<std::vector<cv::Point>>& all_sub_points, std::vector<cv::Scalar>& all_colors);
void loadFeatures();

bool SAVE_FEATURES = true;
int NUM_FEATURES = 2000;     // Increase nfeatures to increase accuracy (default: 500)
int HEIGHT = 883;
int WIDTH = 756;
const std::string URL = "http://192.168.122.1:14141/json_data/UIA.json";

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

// # List of all components based on the provided IDs
std::vector<std::string> sub_components =
{
    "eva1_power", "eva1_oxy", "eva1_water_supply", "eva1_water_waste",
    "eva2_power", "eva2_oxy", "eva2_water_supply", "eva2_water_waste",
    "oxy_vent", "depress"
};

cv::Mat frame, gray_frame;
std::vector<cv::KeyPoint> keypoints_target;
cv::Mat descriptors_target;
cv::Ptr<cv::ORB> orb = cv::ORB::create(NUM_FEATURES);
cv::Ptr<cv::BFMatcher> bf = cv::BFMatcher::create(cv::NORM_HAMMING, true);

// Callback function to write the data received from curl
static size_t WriteCallback(void* buffer, size_t size, size_t nmemb, void* userp)
{
    std::stringstream* ss = static_cast<std::stringstream*>(userp);
    size_t totalSize = size * nmemb;
    ss->write(static_cast<const char*>(buffer), totalSize);
    return totalSize;
}

// Function to perform the GET request and return the result as a string
std::string HttpGet(const std::string& url)
{
    CURL* curl = curl_easy_init();
    if (!curl)
    {
        throw std::runtime_error("CURL initialization failed");
    }

    std::stringstream ss;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &ss);

    CURLcode res = curl_easy_perform(curl);
    if (res != CURLE_OK)
    {
        curl_easy_cleanup(curl);
        throw std::runtime_error(curl_easy_strerror(res));
    }

    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
    curl_easy_cleanup(curl);

    if (http_code == 200)
    { // Check for HTTP OK
        return ss.str();
    }
    else
    {
        std::cerr << "HTTP request failed with status: " << http_code << std::endl;
        return "";
    }
}

// Function to fetch the states using the HTTP GET request
json fetchStates()
{
    try
    {
        std::string jsonData = HttpGet(URL);
        auto data = json::parse(jsonData);
        return data["uia"];
    }
    catch (const std::exception& e)
    {
        std::cerr << "Exception caught: " << e.what() << std::endl;
        return {};
    }
}

void loadFeatures()
{
    // Load the keypoints from the .json file
    std::ifstream keypoints_file("../features/keypoints.json");
    json keypoints_json;
    if (keypoints_file.is_open())
    {
        keypoints_file >> keypoints_json;
        keypoints_file.close();
    }
    else
    {
        std::cout << "Unable to open keypoints file." << std::endl;
        exit(-1);
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
    std::ifstream descriptors_file("../features/descriptors.json");
    json descriptors_json;
    if (descriptors_file.is_open())
    {
        descriptors_file >> descriptors_json;
        descriptors_file.close();
    }
    else
    {
        std::cout << "Unable to open descriptors file." << std::endl;
        exit(-1);
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

void drawRelativeSubcomponent(cv::Mat& frame, cv::Mat& M, json& subcomponents_states,
    std::vector<std::vector<cv::Point>>& all_sub_points, std::vector<cv::Scalar>& all_colors)
{
    for (size_t i = 0; i < SUBCOMPONENTS.size(); ++i)
    {
        bool is_active = subcomponents_states.value(sub_components[i], false);
        cv::Scalar color = is_active ? cv::Scalar(0, 255, 0) : cv::Scalar(0, 0, 255);

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

        std::vector<cv::Point> sub_points;
        for (int j = 0; j < transformed_sub_pts.rows; j++)
        {
            // Convert back to integer points for drawing
            sub_points.push_back(cv::Point(static_cast<int>(transformed_sub_pts.at<cv::Point2f>(j).x),
                                           static_cast<int>(transformed_sub_pts.at<cv::Point2f>(j).y)));
        }

        all_sub_points.push_back(sub_points);
        all_colors.push_back(color);
    }
}

void detectUIA(cv::Mat frame, std::vector<std::vector<cv::Point>>& all_sub_points, std::vector<cv::Scalar>& all_colors)
{
    if (frame.empty())
    {
        std::cerr << "Error: Unable to capture frame from camera." << std::endl;
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

                // std::vector<cv::Point> sub_points;
                // for (int j = 0; j < transformed_corners.rows; j++)
                // {
                //     // Convert back to integer points for drawing
                //     sub_points.push_back(cv::Point(static_cast<int>(transformed_corners.at<cv::Point2f>(j).x),
                //                                 static_cast<int>(transformed_corners.at<cv::Point2f>(j).y)));
                // }
                // cv::polylines(frame, sub_points, true, cv::Scalar(255, 0, 0), 2);

                json subcomponents_states = fetchStates();
                drawRelativeSubcomponent(frame, M, subcomponents_states, all_sub_points, all_colors);
                
                // all_sub_points.push_back(sub_points);
                // all_colors.push_back(cv::Scalar(255, 255, 255));
            }
        }
    }

    if (cv::waitKey(1) & 0xFF == 'q')
    {
        return;
    }
}