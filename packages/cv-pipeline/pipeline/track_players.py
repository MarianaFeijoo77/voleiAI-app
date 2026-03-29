import numpy as np
from typing import List, Dict


def rastrear_jogadores(deteccoes: List[Dict], fps: float) -> List[Dict]:
    """
    Rastreia jogadores entre frames usando Hungarian algorithm (ByteTrack-style).
    Associa IDs persistentes às detecções ao longo do tempo.

    NOTA: Implementação simplificada. Para produção, usar biblioteca supervision
    com ByteTrack integrado: https://supervision.roboflow.com/
    """
    tracks: dict[int, dict] = {}  # track_id → track state
    next_id = 1
    resultado = []

    for frame_data in deteccoes:
        frame_idx = frame_data["frame_idx"]
        timestamp_ms = frame_data["timestamp_ms"]
        boxes = frame_data.get("boxes", [])

        if not boxes:
            resultado.append({
                "frame_idx": frame_idx,
                "timestamp_ms": timestamp_ms,
                "boxes": [],
            })
            continue

        # Associar detecções a tracks existentes por IoU / distância centro
        assigned = {}
        used_tracks = set()

        for box in boxes:
            best_id = None
            best_dist = float("inf")

            for tid, track in tracks.items():
                if tid in used_tracks:
                    continue
                dist = np.sqrt(
                    (box["cx"] - track["cx"]) ** 2 +
                    (box["cy"] - track["cy"]) ** 2
                )
                if dist < best_dist and dist < 80:  # limiar de associação
                    best_dist = dist
                    best_id = tid

            if best_id is not None:
                assigned[id(box)] = best_id
                used_tracks.add(best_id)
                tracks[best_id].update({"cx": box["cx"], "cy": box["cy"], "frames_sem_deteccao": 0})
            else:
                # Nova track
                assigned[id(box)] = next_id
                tracks[next_id] = {
                    "cx": box["cx"],
                    "cy": box["cy"],
                    "cor_dominante": box.get("cor_dominante", "desconhecido"),
                    "frames_sem_deteccao": 0,
                }
                next_id += 1

        # Marcar tracks não detectadas
        for tid in list(tracks.keys()):
            if tid not in used_tracks:
                tracks[tid]["frames_sem_deteccao"] += 1
                if tracks[tid]["frames_sem_deteccao"] > 30:  # remover após 1s sem detecção
                    del tracks[tid]

        # Enriquecer boxes com track_id
        enriched_boxes = []
        for box in boxes:
            box_with_id = dict(box)
            box_with_id["track_id"] = f"J{assigned[id(box)]}"
            box_with_id["cor_time"] = tracks.get(assigned[id(box)], {}).get("cor_dominante", "?")
            enriched_boxes.append(box_with_id)

        resultado.append({
            "frame_idx": frame_idx,
            "timestamp_ms": timestamp_ms,
            "boxes": enriched_boxes,
        })

    return resultado
