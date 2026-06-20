from sqlalchemy import create_engine, Column, String, Integer, Boolean, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import create_engine, Column, Integer, Text, DateTime, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import text
import os
from pathlib import Path
from dotenv import load_dotenv
import os
from sqlalchemy import text

#definicao do caminho das variaveis de ambiente quando se roda localmente
env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv() #quando rodado em docker, vem automaticamente pelo .env da pasta raiz


db_url = os.getenv("DATABASE_URL") #url do supabase

db_url = os.getenv("DATABASE_URL")
db = create_engine(db_url)


#criar a base do banco de dados
Base = declarative_base()

#tabelas: Lugar e Evento
class Lugar(Base):
    __tablename__ = "lugares"
    __table_args__ = {"schema": "lugares"}
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String)
    rua = Column("rua", String)
    numero_rua = Column("numero_rua", String)
    bairro = Column("bairro", String)
    cep = Column("cep", String)
    categoria = Column("categoria", String)
    tags = Column("tags", Text)
    preco = Column("preco", Integer)
    nota = Column("nota", Float)
    qntd_reviews = Column("qntd_reviews", Integer, default=0)
    descricao = Column("descricao", Text)
    ativo = Column("ativo", Boolean, default=True)
    tipo = Column(String(20)) # 'fixo' ou 'evento'
    image_url = Column(String(500), nullable=True) #link para a imagem do lugar
    qntd_reviews = Column("qntd_reviews",Integer)

    evento = relationship("Evento", uselist=False, back_populates="lugar")

    def __init__(self, nome, rua, numero_rua, bairro, cep, categoria,
                 tags, preco, nota, descricao, tipo, image_url):
        self.nome = nome
        self.rua = rua
        self.numero_rua = numero_rua
        self.bairro = bairro
        self.cep = cep
        self.categoria = categoria
        self.tags = tags
        self.preco = preco
        self.nota = nota
        self.descricao = descricao
        self.tipo = tipo
        self.image_url = image_url
        self.ativo = True

    @property
    def _tags(self) -> list[str]:
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(",")]

    @_tags.setter
    def _tags(self, tags_list: list[str]):
        if tags_list:
            self.tags = ",".join(tags_list)
        else:
            self.tags = ""
    
    __mapper_args__ = {
        "polymorphic_on": "tipo",
        "polymorphic_identity": "fixo",
    }

class Evento(Lugar):
    __tablename__ = "eventos"
    __table_args__ = {"schema": "lugares"}

    id = Column("id",Integer, ForeignKey("lugares.lugares.id"), primary_key=True)
    data_inicio = Column("data_inicio",DateTime, nullable=False)
    data_fim = Column("data_fim",DateTime, nullable=False)

    lugar = relationship("Lugar", back_populates="evento")

    def __init__(self, data_inicio, data_fim, **kwargs):
        super().__init__(**kwargs) 
        
        self.data_inicio = data_inicio
        self.data_fim = data_fim
        self.tipo = "evento"

    __mapper_args__ = {
        "polymorphic_identity": "evento",
    }

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
    nota = Column(Integer, nullable=False)
    comentario = Column(Text, nullable=True)
    data_criacao = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'))