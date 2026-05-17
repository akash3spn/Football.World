import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

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

