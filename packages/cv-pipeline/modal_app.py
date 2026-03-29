"""
VôleiAI — Pipeline de Visão Computacional
Modal.com serverless GPU service para análise de partidas de vôlei.
"""
import modal
import json
import os
from pathlib import Path

app = modal.App("volei-ai-cv-pipeline")

# Imagem GPU com todas as dependências de CV
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "ultralytics>=8.0.0",
        "opencv-python-headless>=4.9.0",
        "numpy>=1.26.0",
        "torch>=2.3.0",
        "torchvision>=0.18.0",
        "boto3>=1.34.0",
        "pydantic>=2.7.0",
        "supervision>=0.21.0",
        "lap>=0.4.0",
        "scipy>=1.13.0",
    ])
    .add_local_dir("pipeline", remote_path="/app/pipeline")
    .add_local_dir("schemas", remote_path="/app/schemas")
)

# Volume para cache de modelos (evita download a cada cold start)
model_volume = modal.Volume.from_name("volei-ai-models", create_if_missing=True)


@app.function(
    image=image,
    gpu="A10G",
    timeout=2700,  # 45 minutos máximo
    secrets=[modal.Secret.from_name("volei-ai-secrets")],
    volumes={"/models": model_volume},
    retries=modal.Retries(max_retries=2, backoff_coefficient=2.0),
)
def analisar_partida(video_url: str, match_id: str, callback_url: str = "") -> dict:
    """
    Pipeline principal de análise de partida de vôlei.
    
    Args:
        video_url: Chave do vídeo no Cloudflare R2
        match_id: ID da partida no banco de dados
        callback_url: URL para notificar quando concluído (opcional)
    
    Returns:
        Dicionário com análise completa da partida
    """
    import sys
    import cv2
    import numpy as np
    from ultralytics import YOLO
    
    sys.path.insert(0, "/app")
    
    from pipeline.detect_players import detectar_jogadores
    from pipeline.track_players import rastrear_jogadores
    from pipeline.track_ball import rastrear_bola
    from pipeline.classify_actions import classificar_acoes
    from pipeline.detect_rotations import detectar_rotacoes
    from pipeline.homography import mapear_quadra
    
    print(f"[cv] 🏐 Iniciando análise da partida {match_id}")
    
    # 1. Baixar vídeo do R2
    import boto3
    s3 = boto3.client(
        "s3",
        endpoint_url=os.environ["R2_ENDPOINT"],
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    )
    
    local_path = f"/tmp/{match_id}.mp4"
    print(f"[cv] Baixando vídeo do R2: {video_url}")
    s3.download_file(os.environ["R2_BUCKET"], video_url, local_path)
    print(f"[cv] ✅ Vídeo baixado: {local_path}")
    
    # 2. Obter metadados do vídeo
    cap = cv2.VideoCapture(local_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duracao_seg = total_frames / fps if fps > 0 else 0
    cap.release()
    
    print(f"[cv] Vídeo: {width}x{height} @ {fps:.1f}fps, {duracao_seg:.0f}s ({total_frames} frames)")
    
    # 3. Carregar modelo YOLO (cached no volume)
    model_path = "/models/yolov8x.pt"
    if not Path(model_path).exists():
        print("[cv] Baixando YOLOv8x (primeira vez)...")
        model = YOLO("yolov8x.pt")
        import shutil
        shutil.copy(model.ckpt_path, model_path)
    else:
        print("[cv] Usando YOLOv8x do cache")
        model = YOLO(model_path)
    
    # 4. Executar estágios do pipeline
    print("[cv] Stage 1/6: Detectando jogadores com YOLOv8...")
    deteccoes = detectar_jogadores(local_path, model)
    
    print("[cv] Stage 2/6: Rastreando bola...")
    trajetoria_bola = rastrear_bola(local_path)
    
    print("[cv] Stage 3/6: Rastreando jogadores com ByteTrack...")
    jogadores_rastreados = rastrear_jogadores(deteccoes, fps)
    
    print("[cv] Stage 4/6: Mapeando quadra (homografia)...")
    try:
        mapa_quadra = mapear_quadra(local_path)
    except Exception as e:
        print(f"[cv] ⚠️ Homografia falhou (modo câmera livre): {e}")
        mapa_quadra = None
    
    print("[cv] Stage 5/6: Classificando ações...")
    eventos = classificar_acoes(jogadores_rastreados, trajetoria_bola, fps)
    
    print("[cv] Stage 6/6: Detectando rotações...")
    rotacoes = detectar_rotacoes(jogadores_rastreados, eventos, fps)
    
    # 5. Calcular confiança média
    confiancas = [e["confidence"] for e in eventos if "confidence" in e]
    confianca_media = sum(confiancas) / len(confiancas) if confiancas else 0.0
    
    # 6. Montar resultado
    resultado = {
        "match_id": match_id,
        "duration_seconds": int(duracao_seg),
        "confianca_media": round(confianca_media, 3),
        "fps": round(fps, 2),
        "resolution": {"width": width, "height": height},
        "total_frames": total_frames,
        "events": eventos,
        "rotations": rotacoes,
        "court_mapping_available": mapa_quadra is not None,
    }
    
    print(f"[cv] ✅ Análise concluída: {len(eventos)} eventos, confiança {confianca_media:.1%}")
    
    # 7. Callback para API (se fornecido)
    if callback_url:
        import urllib.request
        try:
            data = json.dumps({
                "matchId": match_id,
                "status": "concluido",
                "cvOutput": resultado,
            }).encode("utf-8")
            req = urllib.request.Request(
                callback_url,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "x-webhook-secret": os.environ.get("WEBHOOK_SECRET", ""),
                },
                method="POST"
            )
            urllib.request.urlopen(req, timeout=30)
            print(f"[cv] ✅ Callback enviado para {callback_url}")
        except Exception as e:
            print(f"[cv] ⚠️ Falha no callback: {e}")
    
    # Limpar arquivo temporário
    Path(local_path).unlink(missing_ok=True)
    
    return resultado


@app.local_entrypoint()
def testar():
    """Ponto de entrada para testes locais."""
    resultado = analisar_partida.remote(
        video_url="test/sample-match.mp4",
        match_id="test-001"
    )
    print(json.dumps(resultado, indent=2, ensure_ascii=False))
