import AsciiLandscape from '../components/AsciiLandscape.jsx'

export default function Login({ onLogin }) {
  return (
    <div className="screen active">
      <div className="panel">
        <div className="login-left">
          <div className="eyebrow">Твои сборки · твои миры</div>
          <div className="wordmark">Горнило</div>
          <div className="tagline">
            Один вход — все сборки. Играй локально или подключайся к постоянным серверам друзей.
          </div>
          <div className="ms-btn" onClick={onLogin}>
            <div className="ms-logo">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            Войти через Microsoft
          </div>
          <div className="login-foot">
            Подтягиваем ник и лицензию из аккаунта Microsoft. Пароль нигде не хранится — только
            защищённый токен на этом устройстве.
          </div>
        </div>
        <div className="login-right">
          <AsciiLandscape />
          <div className="landscape-fade"></div>
          <div className="landscape-label">мир · ночь · сгенерировано локально</div>
        </div>
      </div>
    </div>
  )
}
