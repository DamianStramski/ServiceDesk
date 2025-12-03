import React from 'react';

const UserAvatar = ({ username, role }) => {
    const initials = username
        ? username.substring(0, 2).toUpperCase()
        : '??';

    const isAdmin = role === 'Admin';

    const style = {
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '0.95rem',
        color: 'white',
        background: isAdmin
            ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' // Violet -> Fuchsia (Admin)
            : 'linear-gradient(135deg, #3b82f6, #0ea5e9)', // Blue -> Sky (User)
        boxShadow: isAdmin
            ? '0 0 15px rgba(139, 92, 246, 0.4)'
            : '0 0 10px rgba(59, 130, 246, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0,
        cursor: 'default'
    };

    return (
        <div className="user-avatar" style={style} title={`${username} (${role})`}>
            {initials}
        </div>
    );
};

export default UserAvatar;
