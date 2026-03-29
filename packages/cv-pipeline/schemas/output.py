from pydantic import BaseModel, Field
from typing import List, Optional


class CourtPosition(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0, description="Posição X normalizada (0=esquerda, 1=direita)")
    y: float = Field(..., ge=0.0, le=1.0, description="Posição Y normalizada (0=frente, 1=fundo)")


class Evento(BaseModel):
    timestamp_ms: int
    frame_idx: int
    set: Optional[int] = None
    rally: Optional[int] = None
    team: Optional[str] = None
    player_id: str
    action: str  # saque | recepcao | levantamento | ataque | bloqueio | defesa | bola_livre
    confidence: float = Field(..., ge=0.0, le=1.0)
    court_position: CourtPosition
    outcome: str = "continuacao"  # ponto | erro | continuacao


class PosicaoRotacao(BaseModel):
    posicao_rotacao: str  # P1-P6
    player_id: str
    cx: int
    cy: int
    cor_time: str


class Rotacao(BaseModel):
    rally: int
    timestamp_ms: int
    frame_idx: int
    time_a: List[PosicaoRotacao]
    time_b: List[PosicaoRotacao]


class AnalisePartida(BaseModel):
    match_id: str
    duration_seconds: int
    confianca_media: float
    fps: float
    events: List[Evento]
    rotations: List[Rotacao]
