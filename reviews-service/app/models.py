from sqlalchemy import create_engine, UniqueConstraint, CheckConstraint, Column, Integer, Text, Boolean, DateTime, String
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import text
import os
from pathlib import Path
from dotenv import load_dotenv

# Definicao do caminho das variaveis de ambiente
env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

db_url = os.getenv("DATABASE_URL")
db = create_engine(db_url)
Base = declarative_base()

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint('id_lugar', 'id_usuario', name='uix_lugar_usuario'),
        CheckConstraint('nota >= 1 AND nota <= 5', name='chk_nota_range'),
        {"schema": "reviews"}
    )
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_lugar = Column(Integer, nullable=False)
    id_usuario = Column(Integer, nullable=False)
    nome_autor = Column("nome_autor", String, nullable=False)
    nota = Column(Integer, nullable=False)
    comentario = Column(Text, nullable=True)
    data_criacao = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    is_anonymous = Column(Boolean, nullable=False, default=False)