
# Download pose_landmarker_lite.task from the internet if it's not exist.
TASK_FILE=./posedetection/pose_landmarker_lite.task
if test -f "$TASK_FILE"; then
    echo "INFO: pose_landmarker_lite.task existed. Skip downloading and use the local model."
else
    curl -o ${TASK_FILE} https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
    echo "INFO: Downloaded pose_landmarker_lite.task to $TASK_FILE ."
fi

# Download pose_landmarker_full.task from the internet if it's not exist.
TASK_FILE=./posedetection/pose_landmarker_full.task
if test -f "$TASK_FILE"; then
    echo "INFO: pose_landmarker_full.task existed. Skip downloading and use the local model."
else
    curl -o ${TASK_FILE} https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task
    echo "INFO: Downloaded pose_landmarker_full.task to $TASK_FILE ."
fi

# Download pose_landmarker_heavy.task from the internet if it's not exist.
TASK_FILE=./posedetection/pose_landmarker_heavy.task
if test -f "$TASK_FILE"; then
    echo "INFO: pose_landmarker_heavy.task existed. Skip downloading and use the local model."
else
    curl -o ${TASK_FILE} https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task
    echo "INFO: Downloaded pose_landmarker_heavy.task to $TASK_FILE ."
fi

