import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="auth-container" style={{ textAlign: 'center' }}>
            <Logo size="large" />
            <h1>Witamy w Service Desk</h1>
            <p style={{ marginBottom: '2rem' }}>
                Profesjonalny system obsługi zgłoszeń dla Twojej firmy.
                Zaloguj się, aby zarządzać swoimi sprawami.
            </p>
            <button onClick={() => navigate('/login')} style={{ width: '100%', fontSize: '1.2rem' }}>
                Rozpocznij
            </button>
        </div>
    );
}
