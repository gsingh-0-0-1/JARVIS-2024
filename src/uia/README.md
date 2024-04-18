# UIA Detection Code using OpenCV

- Install OpenCV 
- Install Python

## Python

```cd JARVIS-2024/src/uia/src```
```python3 main.py```

## C++

Create a `build` directory in `uia` directory

```cd JARVIS-2024/src/uia/build/```
```cmake .. && make```
```./detect_uia```

This uses your laptop webcam to detect the UIA.

Note: The TSS should be running in the background to get the UIA detection working. Replace the path of TSS in the code if it is different.