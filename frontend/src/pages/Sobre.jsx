import './Sobre.css'

const TEAM = [
  { name: 'Mariana Gil',      nusp: '11216828', icon: 'fa-solid fa-star',    role: 'Frontend & Design' },
  { name: 'Sabrina Carvalho', nusp: '13833981', icon: 'fa-solid fa-code',    role: 'Arquitetura & Backend' },
  { name: 'Felipe Miotto',    nusp: '13750398', icon: 'fa-solid fa-database', role: 'Backend & Dados' },
]

const SERVICES = [
  { icon: 'fa-solid fa-map-location-dot', title: 'Serviço de Lugares',        desc: 'Gerencia todos os locais cadastrados — busca, filtro, CRUD. É o coração da plataforma.' },
  { icon: 'fa-solid fa-star',             title: 'Serviço de Avaliações',      desc: 'Gerencia comentários e avaliações dos usuários, calculando a nota média após cada avaliação.' },
  { icon: 'fa-solid fa-wand-magic-sparkles', title: 'Serviço de Recomendação', desc: 'Analisa seu histórico e sugere lugares que fazem sentido pra você. Exemplo: se você curte bar, ele te manda os bares mais badalados.' },
  { icon: 'fa-solid fa-gear',             title: 'Módulo de Admin',            desc: 'Área restrita pra gestão interna. Só quem tem acesso de admin consegue cadastrar e remover lugares.' },
]

export default function Sobre() {
  return (
    <div className="page-wrapper about-page">

      <section className="about-hero">
        <div className="container">
          <span className="about-eyebrow">
            <i className="fa-solid fa-graduation-cap"></i> Trabalho Integrado · USP
          </span>
          <h1>Rota <span>Ribeirão</span></h1>
          <p>
            Um guia colaborativo de lugares e eventos em Ribeirão Preto feito por universitários
            para pessoas que querem descobrir novos lugares.
          </p>
        </div>
      </section>

      <section className="about-section container">
        <div className="about-card about-what">
          <i className="fa-solid fa-circle-info about-card__icon"></i>
          <div>
            <h2>O que é isso aqui?</h2>
            <p>
              O <strong>Rota Ribeirão</strong> nasceu como trabalho integrado das disciplinas de
              <em> Sistemas Distribuídos</em> e <em>Introdução ao Desenvolvimento Web</em> na USP.
              A ideia é simples: em vez de ficar abrindo mil abas pra achar um bom restaurante,
              um bar reservado ou um evento que rolando no fim de semana, você encontra tudo
              aqui, num único lugar.
            </p>
            <p>
              Dá pra filtrar por categoria, faixa de preço, ocasião (família, date, comemoração
              com os amigos) e nota. Também tem sistema de favoritos, avaliações em tempo real e
              até um algoritmo que aprende o que você curte pra dar sugestões melhores.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section container">
        <h2 className="section-title">Como o sistema funciona</h2>
        <p className="section-subtitle">Arquitetura distribuída em três camadas</p>
        <div className="about-arch">
          <div className="arch-layer">
            <span className="arch-layer__label">Nível de Interface</span>
            <div className="arch-layer__content">
              <i className="fa-brands fa-react"></i> React + Vite
            </div>
          </div>
          <div className="arch-arrow"><i className="fa-solid fa-arrow-down"></i></div>
          <div className="arch-layer">
            <span className="arch-layer__label">Nível de Aplicação</span>
            <div className="arch-layer__content arch-layer__content--row">
              <span><i className="fa-solid fa-map-location-dot"></i> Lugares</span>
              <span><i className="fa-solid fa-star"></i> Avaliações</span>
              <span><i className="fa-solid fa-wand-magic-sparkles"></i> Recomendação</span>
            </div>
          </div>
          <div className="arch-arrow"><i className="fa-solid fa-arrow-down"></i></div>
          <div className="arch-layer">
            <span className="arch-layer__label">Nível de Dados</span>
            <div className="arch-layer__content">
              <i className="fa-solid fa-database"></i> PostgreSQL
            </div>
          </div>
        </div>
      </section>

      <section className="about-section container">
        <h2 className="section-title">Os microserviços</h2>
        <p className="section-subtitle">Cada parte cuida de uma responsabilidade — esse é o charme do microserviço</p>
        <div className="services-grid">
          {SERVICES.map(s => (
            <div key={s.title} className="service-card">
              <i className={s.icon}></i>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section container">
        <h2 className="section-title">Quem fez o projeto</h2>
        <p className="section-subtitle">Três estudantes de Ciência da Computação:</p>
        <div className="team-grid">
          {TEAM.map(m => (
            <div key={m.name} className="team-card">
              <div className="team-card__avatar">
                <i className={m.icon}></i>
              </div>
              <h3>{m.name}</h3>
              <span className="team-card__role">{m.role}</span>
              <span className="team-card__nusp">nº USP {m.nusp}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section container">
        <div className="about-tech">
          <h2>Stack usada</h2>
          <div className="tech-list">
            <span><i className="fa-brands fa-react"></i> React</span>
            <span><i className="fa-solid fa-bolt"></i> Vite</span>
            <span><i className="fa-brands fa-python"></i> Python + FastAPI</span>
            <span><i className="fa-solid fa-database"></i> PostgreSQL</span>
            <span><i className="fa-brands fa-docker"></i> Docker</span>
          </div>
        </div>
      </section>

    </div>
  )
}
