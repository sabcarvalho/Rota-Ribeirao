from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import os
from pathlib import Path
from app.models import Lugar, Evento
from app.schemas import CriacaoLugarSchema, LugarResponseSchema
app = FastAPI()
# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, substitua "*" pelos domínios reais permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES= int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

brcypt_context = CryptContext(schemes = ["argon2"], deprecated = "auto")
oauth2_schema = OAuth2PasswordBearer(tokenUrl="auth/login-form")

from app.dependencies import get_session, verificar_admin
from sqlalchemy import func

@app.get("/search_place", response_model=list[LugarResponseSchema])
def get_places(
    nome: str | None = None,
    tipo: str | None = None,
    categoria: str | None = None,
    tags: str | None = None,
    session: Session = Depends(get_session)
):
    lugar_query = session.query(Lugar)

    if nome:
        lugar_query = lugar_query.filter(
            Lugar.nome.ilike(f"%{nome}%")
        )

    if tipo:
        lugar_query = lugar_query.filter(
            func.lower(Lugar.tipo)
            == tipo.lower()
        )

    if categoria:
        lugar_query = lugar_query.filter(
            func.lower(Lugar.categoria)
            == categoria.lower()
        )

    if tags:
        lugar_query = lugar_query.filter(
            Lugar.tags.ilike(f"%{tags}%")
        )
    

    return lugar_query.all()


@app.post("/add_place")
def create_place(lugar_schema: CriacaoLugarSchema, session: Session = Depends(get_session), usuario: dict = Depends(verificar_admin)):
    db_place = Lugar(lugar_schema.nome, lugar_schema.rua, lugar_schema.numero_rua,
                        lugar_schema.bairro, lugar_schema.cep, lugar_schema.categoria.lower(),
                        lugar_schema.tags.lower(), lugar_schema.preco, lugar_schema.nota, lugar_schema.descricao,
                        lugar_schema.tipo, lugar_schema.image_url)
    session.add(db_place)
    if lugar_schema.tipo == "evento":
        db_event = Evento(
            lugar_schema.data_inicio,
            lugar_schema.data_fim,
            tipo="evento"
        )
        session.add(db_event)

    
    session.commit()
    session.refresh(db_place)

    return db_place


@app.get("/search_place/", response_model=list[LugarResponseSchema])
async def get_places(ids: list[int] = Query(...), session: Session = Depends(get_session)):
    lugares = session.query(Lugar).filter(Lugar.id.in_(ids)).all()
    
    return lugares

