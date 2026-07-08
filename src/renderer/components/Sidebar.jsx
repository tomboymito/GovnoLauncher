import { packs, statusLabel } from '../../shared/mockPacks.js'

const navItems = ['Сборки', 'Друзья', 'Карта', 'Настройки']

export default function Sidebar({ selectedId, onSelect }) {
  return (
    <div className="sidebar">
      <div className="profile-row">
        <div className="avatar"></div>
        <div>
          <div className="profile-name">Maksim_K</div>
          <div className="profile-sub">В сети</div>
        </div>
      </div>

      {navItems.map((item) => (
        <div key={item} className={`nav-item${item === 'Сборки' ? ' active' : ''}`}>
          <div className="dot"></div>
          {item}
        </div>
      ))}

      <div className="pack-list">
        <div className="pack-list-head">Сборки · {packs.length}</div>
        <div>
          {packs.map((p) => (
            <div
              key={p.id}
              className={`pack-item${p.id === selectedId ? ' selected' : ''}`}
              onClick={() => onSelect(p.id)}
            >
              <div className="pack-name">{p.name}</div>
              <div className="pack-meta">
                <span className={`status-dot ${p.status}`}></span>
                {statusLabel(p.status)} · {p.mcVersion}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
