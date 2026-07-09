import { useEffect, useRef, useState } from 'react'

const STATE_LABEL = {
  idle: 'Готово',
  preparing: 'Подготовка…',
  running: 'Игра запущена'
}

export default function JvmConsole({ pack }) {
  const [lines, setLines] = useState([])
  const [state, setState] = useState('idle')
  const logRef = useRef(null)

  useEffect(() => {
    const offLog = window.gornilo.launcher.onLog((line) => {
      setLines((prev) => [...prev, line])
    })
    const offState = window.gornilo.launcher.onState((next) => setState(next))
    return () => {
      offLog()
      offState()
    }
  }, [])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [lines])

  const handleLaunch = async () => {
    setLines([])
    const result = await window.gornilo.launcher.launchTestPack()
    if (!result.ok) {
      setLines((prev) => [...prev, `Ошибка: ${result.error}`])
    }
  }

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="card-label">Тестовый JVM-запуск · {pack.mcVersion} · Forge {pack.forgeVersion}</div>
      <div className="btn-row" style={{ marginTop: 0 }}>
        <div
          className="btn btn-primary"
          onClick={handleLaunch}
          style={{ opacity: state === 'idle' ? 1 : 0.5, pointerEvents: state === 'idle' ? 'auto' : 'none' }}
        >
          Запустить тест-сборку
        </div>
        <div className="chip">{STATE_LABEL[state] ?? state}</div>
      </div>
      <pre
        ref={logRef}
        style={{
          marginTop: 14,
          height: 220,
          overflowY: 'auto',
          background: 'var(--panel-2)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11.5,
          lineHeight: 1.6,
          color: 'var(--text-mid)',
          whiteSpace: 'pre-wrap'
        }}
      >
        {lines.length === 0 ? 'Логи появятся здесь после запуска…' : lines.join('\n')}
      </pre>
    </div>
  )
}
