import { useState } from 'react'
import Login from './screens/Login.jsx'
import Lobby from './screens/Lobby.jsx'

export default function App() {
  const [screen, setScreen] = useState('login')

  return (
    <div className="frame">
      {screen === 'login' && <Login onLogin={() => setScreen('lobby')} />}
      {screen === 'lobby' && <Lobby />}
    </div>
  )
}
