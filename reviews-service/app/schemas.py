from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreateSchema(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Nota obrigatoriamente de 1 a 5")
    comment: Optional[str] = Field(default=None, description="Comentário opcional")

class ReviewResponseSchema(BaseModel):
    id: int
    id_lugar: int
    id_usuario: int
    nome_autor: str
    nota: int
    comentario: Optional[str]
    data_criacao: datetime

    class Config:
        from_attributes = True