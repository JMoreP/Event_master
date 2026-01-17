import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const STATUS_OPTIONS = [
    { id: 'todo', label: 'Por Hacer', icon: 'radio_button_unchecked', color: 'bg-slate-400', text: 'text-slate-600' },
    { id: 'in-progress', label: 'En Progreso', icon: 'schedule', color: 'bg-blue-500', text: 'text-blue-600' },
    { id: 'review', label: 'En Revisión', icon: 'visibility', color: 'bg-purple-500', text: 'text-purple-600' },
    { id: 'blocked', label: 'Bloqueado', icon: 'block', color: 'bg-red-500', text: 'text-red-600' },
    { id: 'done', label: 'Completado', icon: 'check', color: 'bg-green-500', text: 'text-green-600' },
];

const StatusSelector = ({ currentStatus, onStatusChange, size = 'sm' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const activeStatus = STATUS_OPTIONS.find(s => s.id === currentStatus) || STATUS_OPTIONS[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownHeight = 250; // Approximate height of dropdown with 5 items
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Determine if dropdown should open upwards
            const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

            setPosition({
                top: shouldOpenUpward
                    ? rect.top + window.scrollY - dropdownHeight - 8 // Open above
                    : rect.bottom + window.scrollY + 8, // Open below (default)
                left: rect.left + window.scrollX - (192 - rect.width), // Align right (192 is w-48) or adjust as needed
            });
        }
    }, [isOpen]);

    const handleSelect = (statusId) => {
        onStatusChange(statusId);
        setIsOpen(false);
    };

    const toggleDropdown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    }

    const sizeClasses = size === 'sm' ? 'size-6' : 'size-8';

    return (
        <>
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className={`${sizeClasses} rounded flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-sm
                    ${activeStatus.color}`}
                title={activeStatus.label}
            >
                <span className="material-symbols-outlined filled" style={{ fontSize: size === 'sm' ? '14px' : '18px' }}>
                    {activeStatus.icon}
                </span>
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={{ top: position.top, left: position.left }}
                    className="fixed w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[9999] overflow-hidden animate-fade-in-up"
                >
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
                </div>,
                document.body
            )}
        </>
    );
};

export default StatusSelector;
