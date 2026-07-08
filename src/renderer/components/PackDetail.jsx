import { statusLabel } from '../../shared/mockPacks.js'

function ActionButtons({ status }) {
  if (status === 'installed') {
    return (
      <>
        <div className="btn btn-primary">Играть</div>
        <div className="btn">Обновить</div>
      </>
    )
  }
  if (status === 'missing') {
    return <div className="btn btn-primary">Скачать</div>
  }
  return (
    <div className="btn" style={{ opacity: 0.5 }}>
      Идёт загрузка…
    </div>
  )
}

export default function PackDetail({ pack }) {
  return (
    <div className="main">
      <div className="main-head">
        <div>
          <div className="eyebrow">
            {pack.mcVersion} · v{pack.version}
          </div>
          <div className="main-title">{pack.name}</div>
        </div>
        <div className="chip">{pack.mods} модов</div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-label">Активность сервера · 20 дней</div>
          <div className="bars">
            {pack.bars.map((h, i) => (
              <div key={i} className="bar" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Прогресс веток</div>
          <div className="progress-list">
            <div className="progress-row">
              <div className="progress-label">Tech</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pack.techProgress}%` }}></div>
              </div>
            </div>
            <div className="progress-row">
              <div className="progress-label">Magic</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pack.magicProgress}%` }}></div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14 }} className="server-pill">
            <span className="pulse"></span>
            {pack.online} / {pack.cap} игроков онлайн
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="card-label">Размер</div>
          <div className="stat-num">{pack.size}</div>
          <div className="stat-sub">на диске</div>
        </div>
        <div className="stat-card">
          <div className="card-label">Статус</div>
          <div className="stat-num" style={{ fontSize: 15 }}>
            {statusLabel(pack.status)}
          </div>
          <div className="stat-sub">{pack.id}.gornilo.ru</div>
        </div>
        <div className="stat-card">
          <div className="card-label">Игроков</div>
          <div className="stat-num">
            {pack.online}/{pack.cap}
          </div>
          <div className="stat-sub">сейчас на сервере</div>
        </div>
      </div>

      <div className="map-card">
        <div className="map-title-row">Карта мира · только прогруженная территория</div>
        <div className="map-fog"></div>
        <div className="map-explored" style={{ width: 220, height: 220, top: 20, left: 60 }}></div>
        <div className="map-explored" style={{ width: 130, height: 130, top: 60, left: 260 }}></div>
        <div className="map-marker" style={{ top: 110, left: 150 }}></div>
        <div className="map-marker" style={{ top: 80, left: 300 }}></div>
      </div>

      <div className="btn-row">
        <ActionButtons status={pack.status} />
      </div>
    </div>
  )
}
