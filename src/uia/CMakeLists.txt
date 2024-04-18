cmake_minimum_required(VERSION 2.8)
project(uia_detection)

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(OpenCV REQUIRED)
include_directories(${OpenCV_INCLUDE_DIRS})

# Add a shared library target for uia_detection.cpp
add_library(uia_detection SHARED src/uia_detection.cpp)
# Link the shared library against OpenCV and curl
target_link_libraries(uia_detection ${OpenCV_LIBS} curl)

# Add an executable target for main.cpp
add_executable(detect_uia src/main.cpp)
# Link the detect_uia executable against the shared library
target_link_libraries(detect_uia uia_detection ${OpenCV_LIBS})