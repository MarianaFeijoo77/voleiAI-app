import numpy as np
from typing import List, Dict, Optional, Tuple

ACOES = ["saque", "recepcao", "levantamento", "ataque", "bloqueio", "defesa", "bola_livre"]


def classificar_acoes(
    jogadores: List[Dict],
    trajetoria_bola: List[Dict],
    fps: float,
) -> List[Dict]:
    """
    Classifica ações de toque detectando inflexões na trajetória da bola
    e associando ao jogador mais próximo no momento do toque.
    """
    eventos = []
    pontos_toque = _detectar_toques(trajetoria_bola)

    for toque in pontos_toque:
        frame_idx = toque["frame_idx"]
        jogador = _jogador_mais_proximo(jogadores, frame_idx, toque["posicao"])
        if jogador is None:
            continue

        acao, confianca = _classificar_por_posicao(jogador, toque)

        eventos.append({
            "timestamp_ms": toque["timestamp_ms"],
            "frame_idx": frame_idx,
            "player_id": jogador.get("track_id", "desconhecido"),
            "action": acao,
            "confidence": round(confianca, 3),
            "court_position": {
                "x": round(toque["posicao"]["x"] / 1920, 3),
                "y": round(toque["posicao"]["y"] / 1080, 3),
            },
            "outcome": "continuacao",
        })

    return eventos


def _detectar_toques(trajetoria: List[Dict]) -> List[Dict]:
    """Detecta mudanças de direção >30° na trajetória da bola."""
    toques = []
    for i in range(2, len(trajetoria) - 2):
        p_ant = trajetoria[i - 2]["posicao"]
        p_cur = trajetoria[i]["posicao"]
        p_prox = trajetoria[i + 2]["posicao"]

        if p_ant is None or p_cur is None or p_prox is None:
            continue

        v1 = np.array([p_cur["x"] - p_ant["x"], p_cur["y"] - p_ant["y"]], dtype=float)
        v2 = np.array([p_prox["x"] - p_cur["x"], p_prox["y"] - p_cur["y"]], dtype=float)

        norm = np.linalg.norm(v1) * np.linalg.norm(v2)
        if norm < 1e-6:
            continue

        cos_a = np.dot(v1, v2) / norm
        angulo = np.degrees(np.arccos(np.clip(cos_a, -1, 1)))

        if angulo > 30:
            toques.append({
                "frame_idx": trajetoria[i]["frame_idx"],
                "timestamp_ms": trajetoria[i]["timestamp_ms"],
                "posicao": p_cur,
                "angulo_mudanca": angulo,
            })
    return toques


def _jogador_mais_proximo(
    jogadores_por_frame: List[Dict],
    frame_idx: int,
    posicao_bola: Dict,
) -> Optional[Dict]:
    frame_data = next((f for f in jogadores_por_frame if f["frame_idx"] == frame_idx), None)
    if frame_data is None:
        return None

    melhor = None
    menor_dist = float("inf")
    for box in frame_data.get("boxes", []):
        dist = np.sqrt((box["cx"] - posicao_bola["x"]) ** 2 + (box["cy"] - posicao_bola["y"]) ** 2)
        if dist < menor_dist and dist < 150:
            menor_dist = dist
            melhor = box
    return melhor


def _classificar_por_posicao(jogador: Dict, toque: Dict) -> Tuple[str, float]:
    cy = jogador["cy"]
    cx = jogador["cx"]

    if cy > 900:
        return "saque", 0.75
    if 450 < cy < 650:
        return "ataque", 0.65
    if 400 < cy < 700 and 600 < cx < 1200:
        return "levantamento", 0.60
    if cy < 300:
        return "bloqueio", 0.60
    return "defesa", 0.55
