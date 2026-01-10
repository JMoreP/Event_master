import React, { useState, useEffect } from 'react';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
    const [imgError, setImgError] = useState(false);

    // Reset error state if user photoURL changes
    useEffect(() => {
        setImgError(false);
    }, [user?.photoURL]);

    const sizeMap = {
        'xs': 'size-6 text-[10px]',
        'sm': 'size-9 text-xs',
        'md': 'size-12 text-sm',
        'lg': 'size-24 text-2xl',
        'xl': 'size-32 text-3xl'
    };

    const sizeClasses = sizeMap[size] || sizeMap.md;
    const photoURL = user?.photoURL || user?.imageUrl || user?.image;

    if (!photoURL || imgError) {
        const initials = user?.displayName
            ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : user?.email?.substring(0, 2).toUpperCase() || 'U';

        return (
            <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-800 shadow-sm ${className}`}>
                {initials}
            </div>
        );
    }

    return (
        <img
            src={photoURL}
            alt={user.name || user.displayName || 'Usuario'}
            onError={() => setImgError(true)}
            className={`${sizeClasses} rounded-full object-cover border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-primary/50 transition-all shadow-sm ${className}`}
        />
    );
};

export default UserAvatar;
