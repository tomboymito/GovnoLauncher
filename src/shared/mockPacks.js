// Mock data for Phase 1 (no manifest system yet — see Phase 4).
export const packs = [
  {
    id: 'tech-magic',
    name: 'Tech & Magic',
    version: '1.0.0',
    mcVersion: '1.16.5 Forge',
    status: 'installed',
    size: '5.2 GB',
    mods: 214,
    desc: 'Mekanism, Create, Botania, Blood Magic, Astral Sorcery, Ice and Fire — техно-магическое RPG с квестами.',
    online: 5,
    cap: 8,
    techProgress: 72,
    magicProgress: 45,
    bars: [40, 55, 30, 70, 45, 60, 80, 50, 65, 35, 90, 55, 40, 70, 60, 45, 75, 55, 65, 50]
  },
  {
    id: 'vanilla-plus',
    name: 'Vanilla+',
    version: '2.0.0',
    mcVersion: '1.20.1 Forge',
    status: 'missing',
    size: '8.7 GB',
    mods: 62,
    desc: 'Лёгкая сборка без RPG-механик: улучшения ландшафта, QoL-моды, честный ванильный геймплей.',
    online: 0,
    cap: 10,
    techProgress: 0,
    magicProgress: 0,
    bars: [10, 15, 10, 20, 15, 10, 25, 15, 20, 10, 15, 20, 10, 25, 15, 10, 20, 15, 10, 15]
  },
  {
    id: 'skyblock-rpg',
    name: 'Skyblock RPG',
    version: '1.5.1',
    mcVersion: '1.19.2 Forge',
    status: 'updating',
    size: '3.2 GB',
    mods: 96,
    desc: 'Островной выживач с прокачкой навыков и торговлей между островами.',
    online: 2,
    cap: 6,
    techProgress: 28,
    magicProgress: 60,
    bars: [20, 30, 25, 40, 35, 20, 45, 30, 25, 40, 30, 50, 35, 20, 40, 30, 45, 25, 35, 30]
  }
]

export const statusLabel = (status) =>
  ({ installed: 'Установлено', missing: 'Не установлено', updating: 'Обновляется…' })[status]
