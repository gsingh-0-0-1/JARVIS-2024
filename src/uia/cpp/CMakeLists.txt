cmake_minimum_required(VERSION 3.10)
project(uia_detection)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_BUILD_TYPE Release)

find_package(OpenCV REQUIRED)
include_directories(${OpenCV_INCLUDE_DIRS})

# Add a shared library target for uia_detection.cpp
add_library(uia_detection SHARED src/uia_detection.cpp)
# Link the shared library against OpenCV and curl
target_link_libraries(uia_detection ${OpenCV_LIBS} curl)