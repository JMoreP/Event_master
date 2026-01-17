import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            setInvitations([]);
            setUnreadCount(0);
            return;
        }

        // 1. Listen for Notifications
        const qNotifs = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const newNotif = change.doc.data();
                    const now = Date.now();
                    const createdAt = newNotif.createdAt?.toMillis ? newNotif.createdAt.toMillis() : now;
                    const isRecent = (now - createdAt) < 30000;

                    if (isRecent && currentUser?.notificationPreferences?.browserPush && Notification.permission === "granted") {
                        new Notification(newNotif.title, {
                            body: newNotif.message,
                            icon: "/favicon.ico"
                        });
                    }
                }
            });

            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        }, (error) => {
            console.error("Firestore Error en Notificaciones:", error);
        });

        // 2. Listen for Invitations
        const qInvites = query(
            collection(db, 'invitations'),
            where('email', '==', currentUser.email?.toLowerCase()),
            where('status', '==', 'pending')
        );

        const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
            const invites = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setInvitations(invites);
        }, (error) => {
            console.error("Firestore Error en Invitaciones:", error);
        });

        return () => {
            unsubscribeNotifs();
            unsubscribeInvites();
        };
    }, [currentUser]);

    const markAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unread = notifications.filter(n => !n.read);
            const promises = unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
            await Promise.all(promises);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await deleteDoc(doc(db, 'notifications', notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const sendNotification = async (userId, title, message, type = 'info', link = null) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                userId,
                title,
                message,
                type,
                link,
                read: false,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    };

    const acceptInvitation = async (invitation) => {
        try {
            // 1. Add user to project members
            const projectRef = doc(db, 'projects', invitation.projectId);
            const projectSnap = await getDoc(projectRef);

            if (projectSnap.exists()) {
                const projectData = projectSnap.data();
                const members = projectData.members || [];
                if (!members.includes(currentUser.uid)) {
                    await updateDoc(projectRef, {
                        members: [...members, currentUser.uid]
                    });
                }
            } else {
                console.error("Project does not exist or was deleted.");
                // Optionally handle this case (e.g. notify user)
            }

            // 2. Update invitation status
            await updateDoc(doc(db, 'invitations', invitation.id), {
                status: 'accepted',
                acceptedAt: serverTimestamp()
            });

            // 3. Notify the inviter
            await sendNotification(
                invitation.inviterId,
                'Invitación Aceptada',
                `${currentUser.displayName || currentUser.email} ha aceptado unirse al proyecto: ${invitation.projectName}`,
                'success',
                `/projects/${invitation.projectId}`
            );

            return { success: true };
        } catch (error) {
            console.error("Error accepting invitation:", error);
            throw error;
        }
    };

    const declineInvitation = async (invitation) => {
        try {
            // 1. Update invitation status
            await updateDoc(doc(db, 'invitations', invitation.id), {
                status: 'declined',
                declinedAt: serverTimestamp()
            });

            // 2. Notify the inviter
            await sendNotification(
                invitation.inviterId,
                'Invitación Rechazada',
                `${currentUser.displayName || currentUser.email} ha declinado la invitación al proyecto: ${invitation.projectName}`,
                'warning'
            );

            return { success: true };
        } catch (error) {
            console.error("Error declining invitation:", error);
            throw error;
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            invitations,
            unreadCount,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            sendNotification,
            acceptInvitation,
            declineInvitation
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
