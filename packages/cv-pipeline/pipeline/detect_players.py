"""
Detecção de jogadores usando YOLOv8.
Processa frames em intervalos para eficiência de GPU.
"""
import cv2
import numpy as np
from ultralytics import YOLO
from typing import List, Dict


def detectar_jogadores(
    video_path: str,
    model: YOLO,
    intervalo_frames: int = 3
) -> List[Dict]:
    """
    Detecta jogadores em frames do vídeo usando YOLOv8.
    
    Processa 1 frame a cada `intervalo_frames` para eficiência de GPU.
    Retorna lista de detecções com frame_idx, bboxes e cor do uniforme.
    
    Args:
        video_path: Caminho para o arquivo de vídeo
        model: Modelo YOLOv8 carregado
        intervalo_frames: Processar 1 a cada N frames (3 = eficiente)
    
    Returns:
        Lista de detecções por frame
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    deteccoes = []
    frame_idx = 0
    
    print(f"[detect_players] Processando {total_frames} frames (1/{intervalo_frames})")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_idx % intervalo_frames == 0:
            # Detectar apenas pessoas (classe 0 no COCO)
            resultados = model(
                frame,
                classes=[0],  # Apenas pessoas
                conf=0.4,
                verbose=False,
                imgsz=1280,
            )
            
            boxes = []
            for r in resultados:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    
                    # Filtrar detecções muito pequenas (< 30px altura)
                    altura = y2 - y1
                    if altura < 30:
                        continue
                    
                    box_data = {
                        "x1": round(x1, 1),
                        "y1": round(y1, 1),
                        "x2": round(x2, 1),
                        "y2": round(y2, 1),
                        "conf": round(conf, 3),
                        "cx": round((x1 + x2) / 2, 1),
                        "cy": round((y1 + y2) / 2, 1),
                        "area": round((x2 - x1) * (y2 - y1)),
                    }
                    
                    # Segmentar cor do uniforme na região superior do bbox
                    # (camisa, não calção)
                    roi_superior = frame[
                        int(y1):int(y1 + (y2 - y1) * 0.5),
                        int(x1):int(x2)
                    ]
                    box_data["cor_uniforme"] = _cor_dominante_hsv(roi_superior)
                    
                    boxes.append(box_data)
            
            deteccoes.append({
                "frame_idx": frame_idx,
                "timestamp_ms": int((frame_idx / fps) * 1000),
                "boxes": boxes,
                "num_jogadores": len(boxes),
            })
        
        frame_idx += 1
    
    cap.release()
    
    total_detectado = sum(d["num_jogadores"] for d in deteccoes)
    print(f"[detect_players] ✅ {len(deteccoes)} frames processados, {total_detectado} detecções totais")
    
    return deteccoes


def _cor_dominante_hsv(roi: np.ndarray) -> str:
    """
    Identifica a cor dominante de uma ROI usando espaço HSV.
    
    Retorna nome de cor em português para segmentação de equipes.
    """
    if roi.size == 0 or roi.shape[0] < 5 or roi.shape[1] < 5:
        return "desconhecido"
    
    try:
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        
        # Excluir pixels muito escuros ou muito claros (preto/branco)
        saturacao = hsv[:, :, 1]
        brilho = hsv[:, :, 2]
        
        mask = (saturacao > 50) & (brilho > 40) & (brilho < 240)
        
        if mask.sum() < 10:
            # Muito poucos pixels com cor → provavelmente branco ou preto
            brilho_medio = float(np.mean(brilho))
            return "branco" if brilho_medio > 180 else "preto"
        
        h_values = hsv[:, :, 0][mask]
        h_mean = float(np.mean(h_values))
        
        # Mapeamento hue (0-180 no OpenCV) → cor
        if h_mean < 10 or h_mean > 170:
            return "vermelho"
        elif h_mean < 25:
            return "laranja"
        elif h_mean < 40:
            return "amarelo"
        elif h_mean < 85:
            return "verde"
        elif h_mean < 130:
            return "azul"
        elif h_mean < 155:
            return "roxo"
        else:
            return "vermelho"
            
    except Exception:
        return "desconhecido"
