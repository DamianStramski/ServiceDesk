import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function TicketForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const isEditMode = !!id; // Sprawdzenie czy jesteśmy w trybie edycji

    // Stan formularza
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        status: 'New',
        priority: 'Medium'
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pobieranie danych (kategorie i ewentualnie szczegóły zgłoszenia przy edycji)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pobierz kategorie
                const catResponse = await axios.get('http://localhost:5054/api/Categories', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(catResponse.data);

                // Jeśli tryb edycji, pobierz szczegóły zgłoszenia
                if (isEditMode) {
                    const ticketResponse = await axios.get(`http://localhost:5054/api/tickets/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const ticket = ticketResponse.data;
                    setFormData({
                        title: ticket.title,
                        description: ticket.description,
                        categoryId: ticket.categoryId,
                        status: ticket.status,
                        priority: ticket.priority || 'Medium'
                    });
                }
            } catch (err) {
                console.error("Error fetching data", err);
                setError('Nie udało się pobrać danych.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        fetchData();
    }, [id, token, isEditMode]);

    // Przekieruj Admina jeśli próbuje utworzyć zgłoszenie
    useEffect(() => {
        if (user?.role === 'Admin' && !isEditMode) {
            navigate('/dashboard');
        }
    }, [user, isEditMode, navigate]);

    // Obsługa zmian w polach formularza
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Obsługa wysłania formularza (Tworzenie lub Edycja)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const payload = {
                ...formData,
                categoryId: parseInt(formData.categoryId)
            };

            // W trybie edycji musimy dodać ID do payloadu
            if (isEditMode) {
                payload.id = parseInt(id);
                await axios.put(`http://localhost:5054/api/tickets/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Tworzenie nowego zgłoszenia
                await axios.post('http://localhost:5054/api/tickets', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            navigate('/dashboard');
        } catch (err) {

            console.error("Error saving ticket", err);
            let msg = 'Nie udało się zapisać zgłoszenia.';
            if (err.response) {
                if (typeof err.response.data === 'string') msg = err.response.data;
                else if (err.response.data?.title) msg = err.response.data.title;
                else if (err.response.data?.message) msg = err.response.data.message;
            }
            setError(msg);
        }
    };

    if (loading) return <p>Ładowanie...</p>;

    return (
        <div className="ticket-form-container">
            <h2>{isEditMode ? 'Edytuj zgłoszenie' : 'Utwórz nowe zgłoszenie'}</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Tytuł:</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        maxLength={100}
                    />
                </div>
                <div>
                    <label>Opis:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Kategoria:</label>
                    <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Wybierz kategorię</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                {isEditMode && user?.role === 'Admin' && (
                    <div>
                        <label>Status:</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="New">Nowy</option>
                            <option value="Open">Otwarty</option>
                            <option value="Resolved">Rozwiązany</option>
                            <option value="Closed">Zamknięty</option>
                        </select>
                    </div>
                )}
                <div>
                    <label>Priorytet:</label>
                    <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                    >
                        <option value="Low">Niski</option>
                        <option value="Medium">Średni</option>
                        <option value="High">Wysoki</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit">{isEditMode ? 'Zaktualizuj' : 'Utwórz'}</button>
                    <button type="button" onClick={() => navigate('/dashboard')}>Anuluj</button>
                </div>
            </form>
        </div>
    );
}
