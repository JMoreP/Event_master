import React, { useState, useRef, useEffect } from 'react';

const STATUS_OPTIONS = [
    { id: 'todo', label: 'Por Hacer', icon: 'radio_button_unchecked', color: 'bg-slate-400', text: 'text-slate-600' },
    { id: 'in-progress', label: 'En Progreso', icon: 'schedule', color: 'bg-blue-500', text: 'text-blue-600' },
    { id: 'review', label: 'En Revisión', icon: 'visibility', color: 'bg-purple-500', text: 'text-purple-600' },
    { id: 'blocked', label: 'Bloqueado', icon: 'block', color: 'bg-red-500', text: 'text-red-600' },
    { id: 'done', label: 'Completado', icon: 'check', color: 'bg-green-500', text: 'text-green-600' },
];

const StatusSelector = ({ currentStatus, onStatusChange, size = 'sm' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const activeStatus = STATUS_OPTIONS.find(s => s.id === currentStatus) || STATUS_OPTIONS[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (statusId) => {
        onStatusChange(statusId);
        setIsOpen(false);
    };

    const sizeClasses = size === 'sm' ? 'size-6' : 'size-8';
    const iconSize = size === 'sm' ? 'text-[14px]' : 'text-[18px]';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`${sizeClasses} rounded flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-sm
                    ${activeStatus.color}`}
                title={activeStatus.label}
            >
                <span className="material-symbols-outlined filled" style={{ fontSize: size === 'sm' ? '14px' : '18px' }}>
                    {activeStatus.icon}
                </span>
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden animate-fade-in-up">
                    <div className="p-1.5 space-y-0.5">
                        {STATUS_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(option.id); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                                    ${currentStatus === option.id
                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                            >
                                <div className={`size-6 rounded flex items-center justify-center text-white ${option.color}`}>
                                    <span className="material-symbols-outlined text-[12px] filled">{option.icon}</span>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider">{option.label}</span>
                                {currentStatus === option.id && (
                                    <span className="material-symbols-outlined text-[16px] ml-auto text-primary filled">check_circle</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusSelector;
