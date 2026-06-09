# Rota Ribeirão

Projeto de Sistemas Distribuídos e Desenvolvimento Web.

**Documentação Adicional:** [Google Drive](https://drive.google.com/drive/folders/1PGBj1kU57g-7MBAPuFkLIryFSL5kE5k5?usp=sharing)

---

## Arquitetura do Sistema

O projeto segue uma arquitetura **Multitier** e **Microservices**, garantindo o isolamento de responsabilidades e a escalabilidade independente de cada componente.

- **Nível de Interface:** Frontend responsivo construído em React
- **Nível de Aplicação:** Conjunto de microserviços independentes desenvolvidos com FastAPI (Python).

  - `servico-lugares`: Gestão e busca de estabelecimentos.
  
  - `servico-avaliacoes`: Gerenciamento de notas e comentários (WebSockets para real-time).
  
  - `servico-recomendacao`: Algoritmo de sugestão baseado no perfil do usuário.

- **Nível de Dados:** Banco de dadps relacional com PostgreSQL

---

## 🛠️ Tecnologias e Ferramentas

- **Backend:** Python + FastAPI.
- **Frontend:** TypeScript + React + Vite.
- **Containerização:** Docker & Docker Compose.
- **Hospedagem & Nuvem:** Render
- **Comunicação:** REST API (HTTP) e WebSockets.

---

## 🚀 Como Executar Localmente

Para rodar todo o ecossistema distribuído na sua máquina, você precisará do **Docker** e **Docker Compose** instalados.

1. Clone o repositório:
   ```bash
   git clone https://github.com/sabcarvalho/Rota-Ribeirao.git
   cd Rota-Ribeirao

2. Suba os serviços:
   ```bash
   docker-compose up --build
