import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';
import { apiClient } from './api';

const app = initializeApp(firebaseConfig);
export const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

// Allow messages in foreground
if (messaging) {
    onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // You could use react-toastify here, or Notification API
        if (Notification.permission === 'granted') {
           new Notification(payload.notification?.title || 'Football.World', {
              body: payload.notification?.body,
              icon: '/vite.svg'
           });
        }
    });
}

export const followMatch = async (matchId: string) => {
    try {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            return false;
        }

        let permission = Notification.permission;
        if (permission !== 'granted') {
            permission = await Notification.requestPermission();
        }

        if (permission === 'granted' && messaging) {
             // Getting the token from FCM (requires a configured VAPID key in settings, but we will try without one first if we don't have it, or let FCM read senderId).
             // If VAPID key is missing, it may fail on some browsers depending on FCM config.
             try {
                const token = await getToken(messaging);
                if (token) {
                   await apiClient.post('/api/follow', { matchId, token });
                   
                   // Save locally
                   const follows = getFollowsLocal();
                   if (!follows.find((f: any) => f.entityId === String(matchId) && f.entityType === 'match')) {
                       follows.push({ entityId: String(matchId), entityType: 'match', createdAt: Date.now() });
                       localStorage.setItem('fw_follows', JSON.stringify(follows));
                   }
                   
                   return true;
                }
             } catch (tokenError) {
                 console.error("Token error: ", tokenError);
             }
        }
    } catch (e) {
        console.error("Failed to follow match", e);
    }
    return false;
}

export const unfollowMatch = async (matchId: string) => {
     try {
         let follows = getFollowsLocal();
         follows = follows.filter((f: any) => !(f.entityId === String(matchId) && f.entityType === 'match'));
         localStorage.setItem('fw_follows', JSON.stringify(follows));
     } catch (e) {
         console.error("Unfollow failed", e);
     }
}

const getFollowsLocal = () => {
    const str = localStorage.getItem('fw_follows');
    return str ? JSON.parse(str) : [];
}

// Follow System using LocalStorage for account-free experience
export const followEntity = async (userId: string | null, entityId: string, entityType: 'team' | 'league', entityName: string, entityLogo: string) => {
    try {
        const follows = await getFollows(userId);
        const exists = follows.find((f: any) => f.entityId === String(entityId) && f.entityType === entityType);
        if (!exists) {
            follows.push({
                entityId: String(entityId),
                entityType,
                entityName,
                entityLogo,
                createdAt: Date.now()
            });
            localStorage.setItem('fw_follows', JSON.stringify(follows));
        }
    } catch (e) {
        console.error("Follow failed", e);
    }
}

export const unfollowEntity = async (userId: string | null, entityId: string, entityType: 'team' | 'league') => {
     try {
         let follows = await getFollows(userId);
         follows = follows.filter((f: any) => !(f.entityId === String(entityId) && f.entityType === entityType));
         localStorage.setItem('fw_follows', JSON.stringify(follows));
     } catch (e) {
         console.error("Unfollow failed", e);
     }
}

export const getFollows = async (userId: string | null = null) => {
    try {
        const str = localStorage.getItem('fw_follows');
        return str ? JSON.parse(str) : [];
    } catch (e) {
        console.error("Get follows failed", e);
        return [];
    }
}

