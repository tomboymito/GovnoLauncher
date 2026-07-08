import { useState } from 'react'
import { packs } from '../../shared/mockPacks.js'
import Sidebar from '../components/Sidebar.jsx'
import PackDetail from '../components/PackDetail.jsx'

export default function Lobby() {
  const [selectedId, setSelectedId] = useState(packs[0].id)
  const selectedPack = packs.find((p) => p.id === selectedId)

  return (
    <div className="screen active">
      <div className="panel">
        <Sidebar selectedId={selectedId} onSelect={setSelectedId} />
        <PackDetail pack={selectedPack} />
      </div>
    </div>
  )
}
