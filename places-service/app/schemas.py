from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class UpdateRatingSchema(BaseModel):
    nota: float
    qntd_reviews: int

class AtualizacaoLugarSchema(BaseModel):
    name: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    district: Optional[str] = None
    cep: Optional[str] = None
    category: Optional[str] = None
    occasion: Optional[str] = None
    priceLevel: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    eventStartDate: Optional[datetime] = None
    eventFinishDate: Optional[datetime] = None
    class Config:
        from_attributes = True

class CriacaoLugarSchema(BaseModel):
    name: str
    street: str
    number: str
    district: str
    cep: str
    category: str
    occasion: str
    priceLevel: int
    rating: float
    description: str
    type: Literal["fixo", "evento"] = "fixo"
    image: Optional[str] = None
    eventStartDate: Optional[datetime] = None
    eventFinishDate: Optional[datetime] = None
    status: Literal["ativo", "desativado", "pendente"] = "pendente"
    class Config:
        from_attributes = True

class EventoResponseSchema(BaseModel):
    eventStartDate: datetime = Field(default=None, validation_alias="data_inicio")
    eventFinishDate: datetime = Field(default=None, validation_alias="data_fim")

    class Config:
        from_attributes = True

class LugarResponseSchema(BaseModel):
    id: int
    name: str = Field(validation_alias="nome")
    street: str = Field(validation_alias="rua")
    number: str = Field(validation_alias="numero_rua")
    district: str = Field(validation_alias="bairro")
    cep: str
    category: str = Field(validation_alias="categoria")
    occasion: str = Field(validation_alias="tags")
    priceLevel: int = Field(validation_alias="preco")
    rating: float = Field(validation_alias="nota")
    qntd_reviews: int = Field(default=0)
    description: str = Field(validation_alias="descricao")
    type: str = Field(validation_alias="tipo")
    image: Optional[str] = Field(default=None, validation_alias="image_url")
    event: EventoResponseSchema | None = Field(default=None, validation_alias="evento")
    status: str 

    class Config:
        from_attributes = True


class IdsListSchema(BaseModel):
    ids: list[int]

class CategoriaResponseSchema(BaseModel):
    id: int
    category: str