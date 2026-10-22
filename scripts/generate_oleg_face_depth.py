"""Rebuild the small landmark-relief table from Oleg's public painted face.

Development-only tool. Install mediapipe, pillow, and numpy in a temporary
Python environment and download Google's Face Landmarker task model to
.cache/face_landmarker.task. No private reference photograph is read here.
"""

import json
import math
from pathlib import Path

import mediapipe as mp
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
PORTRAIT = ROOT / "scripts/assets/room02/oleg-face-v8-reference.webp"
MODEL = ROOT / ".cache/face_landmarker.task"
OUTPUT = ROOT / "scripts/assets/room02/oleg-face-depth.json"

painting = Image.open(PORTRAIT).convert("RGBA")
background = Image.new("RGBA", painting.size, (244, 230, 212, 255))
background.alpha_composite(painting)
image = mp.Image(image_format=mp.ImageFormat.SRGB,
                 data=np.asarray(background.convert("RGB")))
with mp.tasks.vision.FaceLandmarker.create_from_model_path(str(MODEL)) as task:
    result = task.detect(image)
if len(result.face_landmarks) != 1:
    raise RuntimeError("Expected exactly one painted face")
coordinates = np.array([[point.x, point.y, point.z]
                        for point in result.face_landmarks[0][:468]])

relief = []
for row in range(25):
    v = row / 24
    image_y = 1 - (.08 + v * .84)
    for column in range(25):
        u = column / 24
        image_x = .12 + u * .76
        distances = ((coordinates[:, 0] - image_x) ** 2 +
                     (coordinates[:, 1] - image_y) ** 2)
        nearest = np.argpartition(distances, 8)[:8]
        close = distances[nearest]
        if close.min() > .085 ** 2:
            relief.append(0)
            continue
        weights = np.exp(-close / (2 * .026 ** 2))
        depth = float(np.dot(weights, coordinates[nearest, 2]) /
                      weights.sum())
        raised = .72 * max(0, .035 - depth)
        feather = min(1, max(0, (.085 - math.sqrt(float(close.min()))) / .045))
        relief.append(round(raised * feather, 5))

OUTPUT.write_text(json.dumps({
    "grid": 25,
    "relief": relief,
    "reference": "painted Oleg portrait, Google MediaPipe Face Landmarker",
}, separators=(",", ":")) + "\n")
print(f"Wrote {OUTPUT.relative_to(ROOT)} ({sum(value > 0 for value in relief)} raised samples)")
