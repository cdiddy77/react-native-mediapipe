echo "INFO: Downloading models for iOS."

# Download efficientnet-lite0.tflite from the internet if doesn't exist.
TFLITE_FILE=./objectdetection/efficientdet-lite0.tflite
if test -f "$TFLITE_FILE"; then
    echo "INFO: efficientdet_lite0.tflite exists. Skip downloading and use the local model."
else
    curl -o ${TFLITE_FILE} https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite
    echo "INFO: Downloaded efficientdet_lite0.tflite to $TFLITE_FILE ."
fi

# Download efficientnet-lite2.tflite from the internet if doesn't exist.
TFLITE_FILE=./objectdetection/efficientdet-lite2.tflite
if test -f "$TFLITE_FILE"; then
    echo "INFO: efficientdet_lite0.tflite exists. Skip downloading and use the local model."
else
    curl -o ${TFLITE_FILE} https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float32/1/efficientdet_lite2.tflite
    echo "INFO: Downloaded efficientdet_lite0.tflite to $TFLITE_FILE ."
fi

# Download ssd_mobilenet-v2.tflite from the internet if doesn't exist.
TFLITE_FILE=./objectdetection/ssd-mobilenet-v2.tflite
if test -f "$TFLITE_FILE"; then
    echo "INFO: ssd_mobilenet_v2.tflite exists. Skip downloading and use the local model."
else
    curl -o ${TFLITE_FILE} https://storage.googleapis.com/mediapipe-models/object_detector/ssd_mobilenet_v2.tflite/float32/1/ssd_mobilenet_v2.tflite
    echo "INFO: Downloaded ssd_mobilenet_v2.tflite to $TFLITE_FILE ."
fi

