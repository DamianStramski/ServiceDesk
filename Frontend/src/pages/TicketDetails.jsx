import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const translatePriority = (priority) => {
    switch (priority) {
        case 'Low': return 'Niski';
        case 'Medium': return 'Średni';
        case 'High': return 'Wysoki';
        default: return priority;
    }
};

export default function TicketDetails() {
    const { id } = useParams();
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();

    // Stan komponentu
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editIsInternal, setEditIsInternal] = useState(false); // Stan edycji flagi wewnętrznej

    // Pobieranie danych zgłoszenia i komentarzy
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pobierz szczegóły zgłoszenia
                const ticketResponse = await axios.get(`http://localhost:5054/api/tickets/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTicket(ticketResponse.data);

                // Pobierz komentarze
                const commentsResponse = await axios.get(`http://localhost:5054/api/comments/ticket/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setComments(commentsResponse.data);
            } catch (err) {
                console.error("Error fetching data", err);
                setError("Nie udało się pobrać danych zgłoszenia.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, token, user, navigate]);

    // Dodawanie nowego komentarza
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await axios.post('http://localhost:5054/api/comments', {
                content: newComment,
                ticketId: parseInt(id),
                isInternal: user.role === 'Admin' ? true : false
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Aktualizacja listy komentarzy (dodanie nowego)
            const createdComment = {
                ...response.data,
                user: { username: user.username }
            };

            setComments([...comments, createdComment]);
            setNewComment('');

        } catch (err) {
            console.error("Error adding comment", err);
            let errorMessage = "Nie udało się dodać komentarza.";
            if (err.response?.data?.errors) {
                errorMessage = JSON.stringify(err.response.data.errors, null, 2);
            } else if (err.response?.data?.title) {
                errorMessage = err.response.data.title;
            }
            alert(`Błąd: ${errorMessage}`);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="loading">Ładowanie...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!ticket) return <div className="error-message">Zgłoszenie nie znalezione.</div>;

    // Usuwanie komentarza
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Czy na pewno chcesz usunąć ten komentarz?")) return;

        try {
            await axios.delete(`http://localhost:5054/api/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error("Error deleting comment", err);
            alert("Nie udało się usunąć komentarza.");
        }
    };

    const startEditing = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
        setEditIsInternal(comment.isInternal);
    };

    const cancelEditing = () => {
        setEditingCommentId(null);
        setEditContent('');
        setEditIsInternal(false);
    };

    const handleUpdateComment = async (commentId) => {
        if (!editContent.trim()) return;

        try {
            await axios.put(`http://localhost:5054/api/comments/${commentId}`, {
                id: commentId,
                content: editContent,
                ticketId: parseInt(id),
                isInternal: user.role === 'Admin' ? editIsInternal : false
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setComments(comments.map(c =>
                c.id === commentId ? { ...c, content: editContent, isInternal: editIsInternal } : c
            ));
            cancelEditing();
        } catch (err) {
            console.error("Error updating comment", err);
            alert("Nie udało się zaktualizować komentarza.");
        }
    };

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        updateStatus(newStatus);
    };

    const updateStatus = async (newStatus) => {
        try {
            await axios.patch(`http://localhost:5054/api/tickets/${id}/status`, `"${newStatus}"`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setTicket({ ...ticket, status: newStatus });
        } catch (err) {
            console.error("Error updating status", err);
            alert("Nie udało się zmienić statusu.");
        }
    };



    return (
        <div className="dashboard-container">
            <header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Logo size="small" />
                    <h1>Szczegóły zgłoszenia #{ticket.id}</h1>
                </div>
                <div className="header-actions">
                    <ThemeToggle />
                    <button onClick={() => navigate('/dashboard')}>Powrót</button>
                    <button onClick={handleLogout}>Wyloguj</button>
                </div>
            </header>

            <main className="ticket-details-main" style={ticket.status === 'Closed' ? { opacity: 0.7, filter: 'grayscale(100%)' } : {}}>
                <div className="ticket-info-card">
                    <div className="ticket-header-details">
                        {user?.role === 'Admin' ? (
                            <>
                                {ticket.status === 'Closed' ? (
                                    <span className="status-badge status-closed" style={{ cursor: 'default' }}>
                                        ZAMKNIĘTE
                                    </span>
                                ) : (
                                    <select
                                        value={ticket.status}
                                        onChange={handleStatusChange}
                                        className={`status-badge status-${ticket.status.toLowerCase()}`}
                                        style={{ border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
                                    >
                                        <option value="New">Nowy</option>
                                        <option value="Open">Otwarty</option>
                                        <option value="Resolved">Rozwiązany</option>
                                    </select>
                                )}
                                <span className={`priority-badge priority-${ticket.priority.toLowerCase()}`}>
                                    {translatePriority(ticket.priority)}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                                    {ticket.status === 'Resolved' ? 'Rozwiązany' :
                                        ticket.status === 'Open' ? 'Otwarty' :
                                            ticket.status === 'New' ? 'Nowy' :
                                                ticket.status === 'Closed' ? 'Zamknięty' : ticket.status}
                                </span>


                                <span className={`priority-badge priority-${ticket.priority.toLowerCase()}`}>
                                    {translatePriority(ticket.priority)}
                                </span>
                            </>
                        )}
                        <span className="ticket-date">
                            {new Date(ticket.createdAt).toLocaleString('pl-PL')}
                        </span>
                    </div>
                    <h2>{ticket.title}</h2>
                    <p className="ticket-description">{ticket.description}</p>
                    {
                        user?.role === 'Admin' && (
                            <div className="ticket-author-info" style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                                <strong>Autor zgłoszenia:</strong> {ticket.user?.username || 'Nieznany'}
                            </div>
                        )
                    }
                </div >

                <div className="comments-section">
                    {user?.role === 'Admin' ? (
                        <>
                            <div className="internal-notes-section" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <h3 style={{ color: '#f59e0b', marginTop: 0 }}>Notatki Administratora</h3>
                                <div className="comments-list">
                                    {comments.filter(c => c.isInternal).length === 0 ? (
                                        <p className="no-comments">Brak notatek.</p>
                                    ) : (
                                        comments.filter(c => c.isInternal).map(comment => (
                                            <div key={comment.id} className="comment-card internal-note" style={{ borderLeft: '4px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                                                <div className="comment-header">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span className="comment-author">{comment.user?.username || 'Użytkownik'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <span className="comment-date">
                                                            {new Date(comment.createdAt).toLocaleString('pl-PL')}
                                                        </span>
                                                        {user && user.username === comment.user?.username && editingCommentId !== comment.id && (
                                                            <div className="comment-actions">
                                                                <button onClick={() => startEditing(comment)} className="icon-btn" title="Edytuj">
                                                                    ✏️
                                                                </button>
                                                                <button onClick={() => handleDeleteComment(comment.id)} className="icon-btn" title="Usuń" style={{ color: '#ef4444' }}>
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {editingCommentId === comment.id ? (
                                                    <div className="edit-comment-form">
                                                        <textarea
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="edit-textarea"
                                                        />
                                                        <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                                            <button type="button" onClick={cancelEditing} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Anuluj</button>
                                                            <button onClick={() => handleUpdateComment(comment.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Zapisz</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="comment-content">{comment.content}</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Formularz dodawania notatki dla Admina - teraz tutaj */}
                                <form onSubmit={handleAddComment} className="comment-form" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '1rem' }}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Dodaj notatkę wewnętrzną..."
                                        required
                                        style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}
                                    />
                                    <button type="submit" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>Dodaj notatkę</button>
                                </form>
                            </div>

                            <h3>Komentarze użytkownika {ticket.user?.username}</h3>
                            <div className="comments-list">
                                {comments.filter(c => !c.isInternal).length === 0 ? (
                                    <p className="no-comments">Brak komentarzy.</p>
                                ) : (
                                    comments.filter(c => !c.isInternal).map(comment => (
                                        <div key={comment.id} className="comment-card">
                                            <div className="comment-header">
                                                <span className="comment-author">{comment.user?.username || 'Użytkownik'}</span>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <span className="comment-date">
                                                        {new Date(comment.createdAt).toLocaleString('pl-PL')}
                                                    </span>
                                                    {user && user.username === comment.user?.username && editingCommentId !== comment.id && (
                                                        <div className="comment-actions">
                                                            <button onClick={() => startEditing(comment)} className="icon-btn" title="Edytuj">
                                                                ✏️
                                                            </button>
                                                            <button onClick={() => handleDeleteComment(comment.id)} className="icon-btn" title="Usuń" style={{ color: '#ef4444' }}>
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {editingCommentId === comment.id ? (
                                                <div className="edit-comment-form">
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="edit-textarea"
                                                    />
                                                    {/* Admin nie może zmienić komentarza użytkownika na notatkę, więc brak checkboxa tutaj dla user comments */}
                                                    <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                                        <button type="button" onClick={cancelEditing} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Anuluj</button>
                                                        <button onClick={() => handleUpdateComment(comment.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Zapisz</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="comment-content">{comment.content}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h3>Komentarze</h3>
                            <div className="comments-list">
                                {comments.length === 0 ? (
                                    <p className="no-comments">Brak komentarzy.</p>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="comment-card">
                                            <div className="comment-header">
                                                <span className="comment-author">{comment.user?.username || 'Użytkownik'}</span>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <span className="comment-date">
                                                        {new Date(comment.createdAt).toLocaleString('pl-PL')}
                                                    </span>
                                                    {user && user.username === comment.user?.username && editingCommentId !== comment.id && (
                                                        <div className="comment-actions">
                                                            <button onClick={() => startEditing(comment)} className="icon-btn" title="Edytuj">
                                                                ✏️
                                                            </button>
                                                            <button onClick={() => handleDeleteComment(comment.id)} className="icon-btn" title="Usuń" style={{ color: '#ef4444' }}>
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {editingCommentId === comment.id ? (
                                                <div className="edit-comment-form">
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="edit-textarea"
                                                    />
                                                    <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                                        <button type="button" onClick={cancelEditing} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Anuluj</button>
                                                        <button onClick={() => handleUpdateComment(comment.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Zapisz</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="comment-content">{comment.content}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Formularz dla zwykłego użytkownika - na dole */}
                            <form onSubmit={handleAddComment} className="comment-form" style={{ marginTop: '2rem' }}>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Dodaj komentarz..."
                                    required
                                />
                                <button type="submit">Dodaj</button>
                            </form>
                        </>
                    )}
                </div>
            </main >
        </div >
    );
}
