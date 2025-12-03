import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const StatsCharts = ({ tickets, avgResolutionTime }) => {
    //Przetwarzanie Danych dla Wykresu Kołowego (Status)
    const statusCounts = tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
    }, {});

    const statusData = [
        { name: 'Nowy', value: statusCounts['New'] || 0, color: '#60a5fa' },       // Niebieski
        { name: 'Otwarty', value: statusCounts['Open'] || 0, color: '#fbbf24' },   // Bursztynowy
        { name: 'Rozwiązany', value: statusCounts['Resolved'] || 0, color: '#34d399' }, // Zielony
        { name: 'Zamknięty', value: statusCounts['Closed'] || 0, color: '#9ca3af' } // Szary
    ].filter(item => item.value > 0);

    //Przetwarzanie Danych dla Wykresu Słupkowego (Priorytet)
    const priorityCounts = tickets.reduce((acc, ticket) => {
        acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
        return acc;
    }, {});

    const priorityData = [
        { name: 'Niski', value: priorityCounts['Low'] || 0, color: '#34d399' },   // Zielony
        { name: 'Średni', value: priorityCounts['Medium'] || 0, color: '#fbbf24' }, // Bursztynowy
        { name: 'Wysoki', value: priorityCounts['High'] || 0, color: '#f87171' }  // Czerwony
    ];

    //Niestandardowy Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '10px',
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)'
                }}>
                    <p className="label" style={{ color: '#fff', margin: 0 }}>{`${label ? label + ': ' : ''}${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="charts-container">
            {/* Karta KPI */}
            <div className="chart-card">
                <h3>Średni Czas Rozwiązania</h3>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#60a5fa', margin: 'auto' }}>
                    {avgResolutionTime ? `${avgResolutionTime.toFixed(1)} dni` : '-'}
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.5rem' }}>Od utworzenia do zamknięcia</p>
            </div>

            {/* Wykres Kołowy Statusu */}
            <div className="chart-card">
                <h3>Status Zgłoszeń</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip content={CustomTooltip} isAnimationActive={false} followCursor={true} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Wykres Słupkowy Priorytetu */}
            <div className="chart-card">
                <h3>Priorytet Zgłoszeń</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={priorityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={CustomTooltip} cursor={{ fill: 'rgba(255,255,255,0.05)' }} isAnimationActive={false} followCursor={true} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {priorityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StatsCharts;