import cv2
import numpy as np
from typing import List, Dict, Optional


def rastrear_bola(video_path: str) -> List[Dict]:
    """
    Rastreia a bola de vôlei usando detecção de objetos circulares e
    interpolação de trajetória.

    NOTA: Implementação de baseline com Hough Circles.
    Para produção, substituir por TrackNetV3:
    https://github.com/alenzenx/TrackNetV3
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    trajetoria = []
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        posicao = _detectar_bola_frame(frame)
        trajetoria.append({
            "frame_idx": frame_idx,
            "timestamp_ms": int((frame_idx / fps) * 1000),
            "posicao": posicao,
            "interpolada": False,
        })
        frame_idx += 1

    cap.release()
    return _interpolar_trajetoria(trajetoria)


def _detectar_bola_frame(frame: np.ndarray) -> Optional[Dict]:
    """Detecta bola usando Hough Circles."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (9, 9), 2)

    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=50,
        param1=50,
        param2=30,
        minRadius=8,
        maxRadius=30,
    )

    if circles is not None:
        circles = np.uint16(np.around(circles))
        x, y, r = circles[0][0]
        return {"x": int(x), "y": int(y), "raio": int(r), "conf": 0.7}

    return None


def _interpolar_trajetoria(trajetoria: List[Dict]) -> List[Dict]:
    """Interpola posições perdidas entre detecções conhecidas."""
    n = len(trajetoria)
    i = 0
    while i < n:
        if trajetoria[i]["posicao"] is None:
            j = i + 1
            while j < n and trajetoria[j]["posicao"] is None:
                j += 1

            if i > 0 and j < n:
                p0 = trajetoria[i - 1]["posicao"]
                p1 = trajetoria[j]["posicao"]
                for k in range(i, j):
                    t = (k - (i - 1)) / (j - (i - 1))
                    trajetoria[k]["posicao"] = {
                        "x": int(p0["x"] + t * (p1["x"] - p0["x"])),
                        "y": int(p0["y"] + t * (p1["y"] - p0["y"])),
                        "raio": p0["raio"],
                        "conf": 0.3,
                    }
                    trajetoria[k]["interpolada"] = True
            i = j
        else:
            i += 1

    return trajetoria
