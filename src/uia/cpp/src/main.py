#!/usr/bin/env python3

import requests
import cv2
import numpy as np
import json

# Position of subcomponents in the target image anti-clockwise from top-left
EMU1_POWER =    [[34, 248], [34, 419], [116, 419], [116, 248]]
EV1_SUPPLY =    [[116, 218], [116, 419], [224, 419], [224, 218]]
EV1_WASTE =     [[224, 218], [224, 419], [331, 419], [331, 218]]
EV1_OXYGEN =    [[250, 443], [250, 637], [331, 637], [331, 443]]
O2_VENT =       [[266, 637], [266, 838], [353, 838], [353, 637]]
EMU2_POWER =    [[638, 248], [638, 419], [719, 419], [719, 248]]
EV2_SUPPLY =    [[420, 218], [420, 419], [531, 419], [531, 218]]
EV2_WASTE =     [[531, 218], [531, 419], [638, 419], [638, 218]]
EV2_OXYGEN =    [[425, 443], [425, 637], [501, 637], [501, 443]]
DEPRESS_PUMP =  [[366, 644], [366, 768], [508, 768], [508, 644]]
SUBCOMPONENTS = [EMU1_POWER, EV1_OXYGEN, EV1_SUPPLY, EV1_WASTE, EMU2_POWER, EV2_OXYGEN, EV2_SUPPLY, EV2_WASTE, O2_VENT, DEPRESS_PUMP]

# List of all components based on the provided IDs
sub_components = [
    "eva1_power", "eva1_oxy", "eva1_water_supply", "eva1_water_waste",
    "eva2_power", "eva2_oxy", "eva2_water_supply", "eva2_water_waste",
    "oxy_vent", "depress"
]

SAVE_FEATURES = True
NUM_FEATURES = 2000     # Increase nfeatures to increase accuracy (default: 500)
DIVISOR = 4
HEIGHT = 3532//DIVISOR
WIDTH = 3024//DIVISOR

URL = "http://192.168.122.1:14141/json_data/UIA.json"

def save_features_to_file(orb, image):

    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Detect keypoints and descriptors
    keypoints, descriptors = orb.detectAndCompute(gray_image, None)

    # Convert keypoints to a serializable format
    keypoint_list = []
    for kp in keypoints:
        keyspoints = (kp.pt, kp.size, kp.angle, kp.response, kp.octave, kp.class_id)
        keypoint_list.append(keyspoints)

    # Save keypoints to a .npy file
    np.save('../features/keypoints.npy', keypoint_list)
    np.save("../features/descriptors.npy", descriptors)
    with open('../features/keypoints.json', 'w') as kp_file:
        json.dump(keypoint_list, kp_file)
    with open('../features/descriptors.json', 'w') as desc_file:
        json.dump(descriptors.tolist(), desc_file)
    print("Save Target Image Features")

def fetch_states():
    try:
        response = requests.get(URL)
        response.raise_for_status()  # This will raise an exception for HTTP errors
        data = response.json()
        return data['uia']
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return {}

def draw_relative_subcomponent(frame, M, subcomponents_states):
    """
    Draws a rectangle for the subcomponent relative to the detected target image.
    `transformed_corners` are the corners of the detected target image in the webcam frame.
    `subcomponent` is a list of points defining the subcomponent relative to the target image.
    """
    for i, subcomponent in enumerate(SUBCOMPONENTS):
        component_state = subcomponents_states.get(sub_components[i], False)
        color = (0, 255, 0) if component_state else (0, 0, 255)

        sub_pts = np.float32(subcomponent).reshape(-1, 1, 2)
        transformed_sub_pts = cv2.perspectiveTransform(sub_pts, M)

        cv2.polylines(frame, [np.int32(transformed_sub_pts)], isClosed=True, color=color, thickness=3)

def main():
    cap = cv2.VideoCapture(0)

    # Initialize ORB detector
    orb = cv2.ORB_create(nfeatures=NUM_FEATURES)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    if SAVE_FEATURES:
        img_target = cv2.imread("../features/UIA.png")
        img_target = cv2.resize(img_target, (WIDTH, HEIGHT))
        save_features_to_file(orb, img_target)
    
    # Load the keypoints from the .npy file
    keypoints_file = np.load('../features/keypoints.npy', allow_pickle=True)
    # Convert the list of tuples back to keypoints using positional arguments
    keypoints_target = []
    for kp in keypoints_file:
        keys = cv2.KeyPoint(kp[0][0], kp[0][1], kp[1], kp[2], kp[3], kp[4], kp[5])
        keypoints_target.append(keys)

    # Load descriptors
    descriptors_target = np.load('../features/descriptors.npy', allow_pickle=True)
    print("Load Target Image Features")

    while True:
        success, frame = cap.read()
        if not success:
            continue

        # Convert frame to grayscale for feature matching
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect keypoints and descriptors in the current frame
        keypoints_frame, descriptors_frame = orb.detectAndCompute(gray_frame, None)

        # Check if descriptors are found in both target and current frame
        if descriptors_target is None or descriptors_frame is None or len(descriptors_frame) == 0 or len(descriptors_target) == 0:
            cv2.imshow("Projected Image", frame)
        else:
            # Ensure both descriptors are of the same type
            if descriptors_target.dtype != descriptors_frame.dtype:
                descriptors_target = descriptors_target.astype('float32')
                descriptors_frame = descriptors_frame.astype('float32')

            # Match descriptors between target image and current frame
            matches = bf.match(descriptors_target, descriptors_frame)
            matches = sorted(matches, key=lambda x: x.distance)
            good_matches = [m for m in matches if m.distance < 50]

            if len(good_matches) > 20:
                source_points = []
                target_points = []
                for m in good_matches:
                    source_points.append(keypoints_target[m.queryIdx].pt)
                    target_points.append(keypoints_frame[m.trainIdx].pt)
                source_points = np.float32(source_points).reshape(-1, 1, 2)
                target_points = np.float32(target_points).reshape(-1, 1, 2)
                M, mask = cv2.findHomography(source_points, target_points, cv2.RANSAC, 5.0)

                if M is not None and mask.sum() > 10:
                    # Prepare a set of points for perspective transformation
                    target_corners = np.float32([[0, 0], [WIDTH, 0], [WIDTH, HEIGHT], [0, HEIGHT]]).reshape(-1, 1, 2)
                    transformed_corners = np.int32(cv2.perspectiveTransform(target_corners, M))
                    
                    # DO NOT DELETE THIS LINE
                    frame = cv2.polylines(frame, [np.int32(transformed_corners)], isClosed=True, color=(255, 0, 0), thickness=2)

                    # Fetch states from the web server
                    subcomponents_states = fetch_states()

                    # draw_relative_subcomponent(frame, transformed_corners, subcomponents_states)
                    draw_relative_subcomponent(frame, M, subcomponents_states)

                    cv2.imshow("Projected Image", frame)
                else:
                    cv2.imshow("Projected Image", frame)
            else:
                cv2.imshow("Projected Image", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()