from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreateSchema(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Nota obrigatoriamente de 1 a 5")
    comment: Optional[str] = Field(default=None, description="Comentário opcional")
    is_anonymous: bool = False

class ReviewResponseSchema(BaseModel):
    id: int
    id_lugar: int
    id_usuario: int
    nome_autor: str = Field(alias="author")
    nota: int = Field(alias="rating")
    comentario: Optional[str] = Field(default=None, alias="comment")
    data_criacao: datetime = Field(alias="date")
    is_anonymous: bool

    class Config:
        from_attributes = True
        populate_by_name = True