import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Reorder, motion } from 'framer-motion';
import Logo from '../components/Logo';
import StatsCharts from '../components/StatsCharts';
import ThemeToggle from '../components/ThemeToggle';
import UserAvatar from '../components/UserAvatar';

export default function Dashboard() {
    const { user, logout, token } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [avgResolutionTime, setAvgResolutionTime] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Stan filtrów
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        priority: ''
    });

    // Konfiguracja sortowania
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    // Stan paginacji
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Obsługa zmiany filtrów
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Obsługa zmiany sortowania
    const handleSortChange = (e) => {
        const value = e.target.value;
        if (value === 'manual') {
            setSortConfig({ key: 'manual', direction: 'asc' });
        } else {
            const [key, direction] = value.split('-');
            setSortConfig({ key, direction });
        }
    };

    // Resetowanie paginacji przy zmianie filtrów lub sortowania
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortConfig]);

    // Pobieranie danych z API
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pobierz zgłoszenia
                const ticketsResponse = await axios.get('http://localhost:5054/api/tickets', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTickets(ticketsResponse.data);

                // Pobierz KPI (tylko dla Admina)
                if (user?.role === 'Admin') {
                    const kpiResponse = await axios.get('http://localhost:5054/api/tickets/average-resolution-time', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // API zwraca obiekt { averageHours: value }, ale wartość to dni (zgodnie z funkcją SQL)
                    setAvgResolutionTime(kpiResponse.data.averageHours);
                }
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, user]);

    // Wylogowanie użytkownika
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Tłumaczenie statusów na język polski
    const translateStatus = (status) => {
        switch (status) {
            case 'New': return 'Nowy';
            case 'Open': return 'Otwarty';
            case 'Resolved': return 'Rozwiązany';
            case 'Closed': return 'Zamknięty';
            default: return status;
        }
    };

    // Tłumaczenie priorytetów na język polski
    const translatePriority = (priority) => {
        switch (priority) {
            case 'Low': return 'Niski';
            case 'Medium': return 'Średni';
            case 'High': return 'Wysoki';
            default: return priority || 'Średni';
        }
    };

    // Pobieranie klasy CSS dla koloru priorytetu
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return 'priority-low';
            case 'Medium': return 'priority-medium';
            case 'High': return 'priority-high';
            default: return 'priority-medium';
        }
    };

    // Pobieranie klasy CSS dla koloru statusu
    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'status-new';
            case 'Open': return 'status-open';
            case 'Resolved': return 'status-resolved';
            case 'Closed': return 'status-closed';
            default: return '';
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            ticket.id.toString().includes(filters.search);
        const matchesStatus = filters.status ? ticket.status === filters.status : true;
        const matchesPriority = filters.priority ? ticket.priority === filters.priority : true;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const sortedTickets = [...filteredTickets].sort((a, b) => {
        if (sortConfig.key === 'manual') return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'createdAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        if (sortConfig.key === 'priority') {
            const priorityOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
            aValue = priorityOrder[aValue] || 0;
            bValue = priorityOrder[bValue] || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleConfirmResolution = async (ticketId) => {
        if (!window.confirm("Czy na pewno chcesz potwierdzić rozwiązanie i zamknąć zgłoszenie?")) return;
        try {
            await axios.patch(`http://localhost:5054/api/tickets/${ticketId}/status`, `"Closed"`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            // Aktualizuj stan lokalny
            setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'Closed' } : t));
        } catch (err) {
            console.error("Error confirming resolution", err);
            let errorMessage = "Nie udało się potwierdzić rozwiązania.";
            if (err.response?.data) {
                errorMessage += ` ${err.response.data}`;
            }
            alert(errorMessage);
        }
    };

    const handleRejectResolution = async (ticketId) => {
        if (!window.confirm("Czy na pewno chcesz odrzucić rozwiązanie i otworzyć zgłoszenie ponownie?")) return;
        try {
            await axios.patch(`http://localhost:5054/api/tickets/${ticketId}/status`, `"Open"`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            // Aktualizuj stan lokalny
            setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'Open' } : t));
        } catch (err) {
            console.error("Error rejecting resolution", err);
            let errorMessage = "Nie udało się odrzucić rozwiązania.";
            if (err.response?.data) {
                errorMessage += ` ${err.response.data}`;
            }
            alert(errorMessage);
        }
    };

    const handleReorder = (newOrder) => {
        if (filters.search || filters.status || filters.priority) {
            return;
        }
        setTickets(newOrder);
        if (sortConfig.key !== 'manual') {
            setSortConfig({ key: 'manual', direction: 'asc' });
        }
    };

    // Paginacja
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTickets = sortedTickets.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const isFiltered = filters.search || filters.status || filters.priority;

    return (
        <div className="dashboard-container">
            <header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Logo size="small" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1>Witaj, {user?.username}</h1>
                        <div style={{ transform: 'translateY(-6px)' }}>
                            <UserAvatar username={user?.username} role={user?.role} />
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <ThemeToggle />
                    {user?.role === 'Admin' && (
                        <button onClick={async () => {
                            try {
                                const response = await axios.get('http://localhost:5054/api/reports/tickets-pdf', {
                                    headers: { Authorization: `Bearer ${token}` },
                                    responseType: 'blob'
                                });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `Raport_Zgloszen_${new Date().toISOString().split('T')[0]}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                            } catch (error) {
                                console.error("Error downloading report", error);
                                alert("Błąd podczas generowania raportu.");
                            }
                        }} className="secondary-btn">
                            Generuj Raport PDF
                        </button>
                    )}
                    {user?.role !== 'Admin' && (
                        <button onClick={() => navigate('/tickets/new')}>Utwórz nowe zgłoszenie</button>
                    )}
                    <button onClick={handleLogout}>Wyloguj</button>
                </div>
            </header>

            {user?.role === 'Admin' && <StatsCharts tickets={tickets} avgResolutionTime={avgResolutionTime} />}

            <div className="filters-container">
                <div className="search-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        name="search"
                        placeholder="Szukaj zgłoszenia..."
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="search-input"
                    />
                </div>

                <div className="filters-group">
                    <div className="select-wrapper">
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
                            <option value="">Status: Wszystkie</option>
                            <option value="New">Nowy</option>
                            <option value="Open">Otwarty</option>
                            <option value="Resolved">Rozwiązany</option>
                            <option value="Closed">Zamknięty</option>
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="select-icon">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    <div className="select-wrapper">
                        <select name="priority" value={filters.priority} onChange={handleFilterChange} className="filter-select">
                            <option value="">Priorytet: Wszystkie</option>
                            <option value="Low">Niski</option>
                            <option value="Medium">Średni</option>
                            <option value="High">Wysoki</option>
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="select-icon">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    <div className="select-wrapper">
                        <select onChange={handleSortChange} className="filter-select" value={sortConfig.key === 'manual' ? 'manual' : `${sortConfig.key}-${sortConfig.direction}`}>
                            <option value="manual">Własna kolejność</option>
                            <option value="createdAt-desc">Najnowsze</option>
                            <option value="createdAt-asc">Najstarsze</option>
                            <option value="priority-desc">Priorytet (Malejąco)</option>
                            <option value="priority-asc">Priorytet (Rosnąco)</option>
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="select-icon">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
            </div>

            <main>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>{user?.role === 'Admin' ? 'Wszystkie zgłoszenia' : 'Twoje zgłoszenia'} <span style={{ opacity: 0.5, fontSize: '0.8em' }}>({sortedTickets.length})</span></h2>
                </div>

                {loading ? (
                    <div className="ticket-list">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="ticket-card-item skeleton" style={{ height: '200px', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="skeleton-block" style={{ width: '60px', height: '20px' }}></div>
                                    <div className="skeleton-block" style={{ width: '100px', height: '20px' }}></div>
                                    <div className="skeleton-block" style={{ width: '80px', height: '20px' }}></div>
                                </div>
                                <div className="skeleton-text" style={{ width: '70%', height: '28px', marginBottom: '1.5rem' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                                    <div className="skeleton-block" style={{ width: '120px', height: '20px' }}></div>
                                    <div className="skeleton-block" style={{ width: '80px', height: '36px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {isFiltered ? (
                            <motion.div
                                className="ticket-list"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.05
                                        }
                                    }
                                }}
                            >
                                {currentTickets.map((ticket) => (
                                    <motion.div
                                        key={ticket.id}
                                        layout
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="ticket-card-item"
                                    >
                                        <div className="ticket-card-content glass-panel" style={ticket.status === 'Closed' ? { opacity: 0.7, filter: 'grayscale(100%)' } : {}}>
                                            <div className="ticket-header">
                                                <div className="ticket-info-group">
                                                    <span className="info-label">ID:</span>
                                                    <span className="ticket-id">#{ticket.id}</span>
                                                </div>
                                                {user?.role === 'Admin' && (
                                                    <div className="ticket-info-group">
                                                        <span className="info-label">Autor:</span>
                                                        <span className="ticket-id" style={{ background: 'hsla(210, 100%, 60%, 0.1)', color: 'var(--accent-secondary)' }}>
                                                            {ticket.user?.username || 'Nieznany'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="ticket-info-group">
                                                    <span className="info-label">Priorytet:</span>
                                                    <span className={`priority-badge ${getPriorityColor(ticket.priority)}`}>
                                                        {translatePriority(ticket.priority)}
                                                    </span>
                                                </div>
                                                <div className="ticket-info-group">
                                                    <span className="info-label">Status:</span>
                                                    <span className={`status-badge ${getStatusColor(ticket.status)}`}>
                                                        {translateStatus(ticket.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3
                                                className="ticket-title clickable"
                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {ticket.title}
                                            </h3>
                                            <div className="ticket-footer">
                                                <span className="ticket-date">
                                                    {new Date(ticket.createdAt).toLocaleString('pl-PL', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {user?.role !== 'Admin' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => navigate(`/tickets/edit/${ticket.id}`)} className="secondary-btn">Edytuj</button>
                                                        {ticket.status === 'Resolved' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleConfirmResolution(ticket.id)}
                                                                    className="secondary-btn"
                                                                    style={{
                                                                        backgroundColor: '#10b981',
                                                                        color: 'white',
                                                                        borderColor: '#10b981'
                                                                    }}
                                                                    title="Potwierdź rozwiązanie"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectResolution(ticket.id)}
                                                                    className="secondary-btn"
                                                                    style={{
                                                                        backgroundColor: '#ef4444',
                                                                        color: 'white',
                                                                        borderColor: '#ef4444'
                                                                    }}
                                                                    title="Odrzuć rozwiązanie"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <Reorder.Group axis="y" values={currentTickets} onReorder={handleReorder} className="ticket-list" layoutScroll>
                                {currentTickets.map((ticket) => (
                                    <Reorder.Item
                                        key={ticket.id}
                                        value={ticket}
                                        className="ticket-card-item"
                                        whileDrag={{ scale: 1.02, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)", zIndex: 10 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <div className="ticket-card-content glass-panel" style={ticket.status === 'Closed' ? { opacity: 0.7, filter: 'grayscale(100%)' } : {}}>
                                            <div className="ticket-header">
                                                <div className="ticket-info-group">
                                                    <span className="info-label">ID:</span>
                                                    <span className="ticket-id">#{ticket.id}</span>
                                                </div>
                                                {user?.role === 'Admin' && (
                                                    <div className="ticket-info-group">
                                                        <span className="info-label">Autor:</span>
                                                        <span className="ticket-id" style={{ background: 'hsla(210, 100%, 60%, 0.1)', color: 'var(--accent-secondary)' }}>
                                                            {ticket.user?.username || 'Nieznany'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="ticket-info-group">
                                                    <span className="info-label">Priorytet:</span>
                                                    <span className={`priority-badge ${getPriorityColor(ticket.priority)}`}>
                                                        {translatePriority(ticket.priority)}
                                                    </span>
                                                </div>
                                                <div className="ticket-info-group">
                                                    <span className="info-label">Status:</span>
                                                    <span className={`status-badge ${getStatusColor(ticket.status)}`}>
                                                        {translateStatus(ticket.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3
                                                className="ticket-title clickable"
                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {ticket.title}
                                            </h3>
                                            <div className="ticket-footer">
                                                <span className="ticket-date">
                                                    {new Date(ticket.createdAt).toLocaleString('pl-PL', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {user?.role !== 'Admin' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => navigate(`/tickets/edit/${ticket.id}`)} className="secondary-btn">Edytuj</button>
                                                        {ticket.status === 'Resolved' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleConfirmResolution(ticket.id)}
                                                                    className="secondary-btn"
                                                                    style={{
                                                                        backgroundColor: '#10b981',
                                                                        color: 'white',
                                                                        borderColor: '#10b981'
                                                                    }}
                                                                    title="Potwierdź rozwiązanie"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectResolution(ticket.id)}
                                                                    className="secondary-btn"
                                                                    style={{
                                                                        backgroundColor: '#ef4444',
                                                                        color: 'white',
                                                                        borderColor: '#ef4444'
                                                                    }}
                                                                    title="Odrzuć rozwiązanie"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        )}

                        {/* Kontrolki paginacji */}
                        {totalPages > 1 && (
                            <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        opacity: currentPage === 1 ? 0.5 : 1,
                                        background: 'var(--bg-secondary)',
                                        border: 'var(--glass-border)',
                                        color: 'var(--text-primary)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: currentPage === 1 ? 'default' : 'pointer'
                                    }}
                                >
                                    &lt;
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        style={{
                                            background: currentPage === i + 1 ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                                            color: currentPage === i + 1 ? 'white' : 'var(--text-primary)',
                                            border: currentPage === i + 1 ? 'none' : 'var(--glass-border)',
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            minWidth: '2.5rem'
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        opacity: currentPage === totalPages ? 0.5 : 1,
                                        background: 'var(--bg-secondary)',
                                        border: 'var(--glass-border)',
                                        color: 'var(--text-primary)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: currentPage === totalPages ? 'default' : 'pointer'
                                    }}
                                >
                                    &gt;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
