import numpy as np
from typing import List, Dict


def detectar_rotacoes(
    jogadores: List[Dict],
    eventos: List[Dict],
    fps: float,
) -> List[Dict]:
    """
    Detecta snapshots de rotação ao início de cada rally (inferido por
    intervalos de ausência de eventos / silêncio na bola).

    Retorna lista de rotações com timestamp, posições dos jogadores, e
    mapeamento P1-P6 estimado por posição na quadra.
    """
    rotacoes = []
    rally_num = 0

    # Identificar inícios de rally por gaps > 3s entre eventos
    timestamps = sorted([e["timestamp_ms"] for e in eventos])
    rally_starts_ms = [timestamps[0]] if timestamps else []

    for i in range(1, len(timestamps)):
        gap = timestamps[i] - timestamps[i - 1]
        if gap > 3000:  # gap > 3s = novo rally
            rally_starts_ms.append(timestamps[i])

    for start_ms in rally_starts_ms:
        rally_num += 1
        frame_idx = int((start_ms / 1000) * fps)

        frame_data = next((f for f in jogadores if f["frame_idx"] == frame_idx), None)
        if frame_data is None:
            continue

        boxes = frame_data.get("boxes", [])
        if len(boxes) < 2:
            continue

        # Dividir jogadores por lado da quadra (time A: esquerda, time B: direita)
        largura_media = 1920
        time_a = [b for b in boxes if b["cx"] < largura_media / 2]
        time_b = [b for b in boxes if b["cx"] >= largura_media / 2]

        rotacoes.append({
            "rally": rally_num,
            "timestamp_ms": start_ms,
            "frame_idx": frame_idx,
            "time_a": _mapear_posicoes(time_a),
            "time_b": _mapear_posicoes(time_b),
        })

    return rotacoes


def _mapear_posicoes(jogadores: List[Dict]) -> List[Dict]:
    """
    Mapeia até 6 jogadores para posições P1-P6 com base em coordenadas.
    P1 = fundo direito, P2 = meio direito, P3 = frente direito,
    P4 = frente esquerdo, P5 = meio esquerdo, P6 = fundo esquerdo.
    """
    if not jogadores:
        return []

    # Ordenar por posição na quadra (y crescente = frente → fundo)
    sorted_j = sorted(jogadores[:6], key=lambda b: (round(b["cy"] / 200), b["cx"]))

    resultado = []
    for i, j in enumerate(sorted_j):
        resultado.append({
            "posicao_rotacao": f"P{i + 1}",
            "player_id": j.get("track_id", f"J{i + 1}"),
            "cx": round(j["cx"]),
            "cy": round(j["cy"]),
            "cor_time": j.get("cor_time", "?"),
        })
    return resultado
