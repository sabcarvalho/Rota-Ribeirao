from sqlalchemy import create_engine, Column, String, Integer, Boolean, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base
from pathlib import Path
from dotenv import load_dotenv
import os
from sqlalchemy import text

env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()



# URL de conexão para PostgreSQL síncrono (psycopg2)
db_url = os.getenv("DATABASE_URL")

db = create_engine(db_url)


#criar a base do banco de dados
Base = declarative_base()

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
    descricao = Column("descricao", Text)
    ativo = Column("ativo", Boolean, default=True)
    tipo = Column(String(20)) # 'fixo' ou 'evento'
    image_url = Column(String(500), nullable=True) #link para a imagem do lugar

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
        "polymorphic_on": tipo,
        "polymorphic_identity": "fixo",
    }

class Evento(Lugar):
    __tablename__ = "eventos"
    __table_args__ = {"schema": "lugares"}

    id = Column("id",Integer, ForeignKey("lugares.lugares.id"), primary_key=True)
    data_inicio = Column("data_inicio",DateTime, nullable=False)
    data_fim = Column("data_fim",DateTime, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": "evento",
    }