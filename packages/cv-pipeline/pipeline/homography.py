import cv2
import numpy as np
from typing import Optional, Tuple


# Dimensões reais de uma quadra de vôlei (metros)
QUADRA_LARGURA = 18.0
QUADRA_ALTURA = 9.0

# Coordenadas de destino normalizadas (0-1)
PONTOS_DESTINO = np.float32([
    [0.0, 0.0],   # fundo esquerdo
    [1.0, 0.0],   # fundo direito
    [1.0, 1.0],   # frente direito
    [0.0, 1.0],   # frente esquerdo
])


def mapear_quadra(frame: np.ndarray) -> Optional[np.ndarray]:
    """
    Estima a homografia da câmera para mapear coordenadas de pixel
    para coordenadas normalizadas da quadra (0-1).

    Retorna matriz de homografia 3x3, ou None se não for possível calcular.

    NOTA: Implementação usa detecção de linhas da quadra.
    Para robustez em produção, usar pontos de referência marcados manualmente
    no primeiro frame via UI do treinador.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)

    if lines is None or len(lines) < 4:
        return None

    # Filtrar linhas horizontais e verticais
    h_lines = []
    v_lines = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        if abs(angle) < 15 or abs(angle) > 165:
            h_lines.append(line[0])
        elif 75 < abs(angle) < 105:
            v_lines.append(line[0])

    if len(h_lines) < 2 or len(v_lines) < 2:
        return None

    # Usar linhas extremas para estimar cantos da quadra
    h_lines_sorted = sorted(h_lines, key=lambda l: (l[1] + l[3]) / 2)
    v_lines_sorted = sorted(v_lines, key=lambda l: (l[0] + l[2]) / 2)

    top_h = h_lines_sorted[0]
    bot_h = h_lines_sorted[-1]
    left_v = v_lines_sorted[0]
    right_v = v_lines_sorted[-1]

    def interseccao(l1, l2):
        x1, y1, x2, y2 = l1
        x3, y3, x4, y4 = l2
        denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
        if abs(denom) < 1e-6:
            return None
        t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
        return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]

    cantos = [
        interseccao(top_h, left_v),
        interseccao(top_h, right_v),
        interseccao(bot_h, right_v),
        interseccao(bot_h, left_v),
    ]

    if any(c is None for c in cantos):
        return None

    src = np.float32(cantos)
    h, w = frame.shape[:2]
    dst = PONTOS_DESTINO * np.float32([w, h])

    H, status = cv2.findHomography(src, dst)
    return H


def pixel_para_quadra(px: float, py: float, H: np.ndarray) -> Tuple[float, float]:
    """Transforma coordenadas de pixel para coordenadas normalizadas da quadra (0-1)."""
    ponto = np.float32([[[px, py]]])
    transformado = cv2.perspectiveTransform(ponto, H)
    qx, qy = transformado[0][0]
    return (float(np.clip(qx, 0, 1)), float(np.clip(qy, 0, 1)))
