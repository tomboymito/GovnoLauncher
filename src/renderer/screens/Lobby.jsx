import { useEffect, useState } from 'react'
import { packs } from '../../shared/mockPacks.js'
import Sidebar from '../components/Sidebar.jsx'
import PackDetail from '../components/PackDetail.jsx'
import JvmConsole from '../components/JvmConsole.jsx'

export default function Lobby() {
  const [selectedId, setSelectedId] = useState(packs[0].id)
  const [testPack, setTestPack] = useState(null)
  const selectedPack = packs.find((p) => p.id === selectedId)

  useEffect(() => {
    window.gornilo?.launcher.getTestPack().then(setTestPack)
  }, [])

  return (
    <div className="screen active">
      <div className="panel">
        <Sidebar selectedId={selectedId} onSelect={setSelectedId} />
        <div className="main">
          <PackDetail pack={selectedPack} />
          {testPack && <JvmConsole pack={testPack} />}
        </div>
      </div>
    </div>
  )
}
