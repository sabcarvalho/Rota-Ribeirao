from sqlalchemy import create_engine, Column, String, Integer, Boolean, Index, ForeignKey
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

#criar as classes/tabelas do banco
#tabelas: Usuario, Pedido, ItensPedido
class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"schema": "usuarios"}

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String)
    email = Column("email", String, nullable=False)
    senha = Column("senha", String)
    ativo = Column("ativo", Boolean, default=True)
    admin = Column("admin", Boolean, default=False)

    def __init__(self, nome, email, senha, ativo=True, admin=False):
        self.nome = nome
        self.email = email
        self.senha = senha
        self.ativo = ativo
        self.admin = admin

class Favorito(Base):
    __tablename__ = "favoritos"
    __table_args__ = (
        # Criamos um índice na coluna id_lugar para buscas e exclusões ultra rápidas
        Index("idx_favorito_lugar", "id_lugar"),
        {"schema": "usuarios"}
    )

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer,ForeignKey("usuarios.usuarios.id",ondelete="CASCADE"),nullable=False)
    id_lugar = Column(Integer,nullable=False)

    def __init__(self, id_usuario, id_lugar):
        self.id_usuario = id_usuario
        self.id_lugar = id_lugar