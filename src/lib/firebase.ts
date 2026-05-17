import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        // Create user doc if not exists
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
            userId: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            country: 'BD', // Default BD as requested
            theme: localStorage.getItem('theme') || 'dark',
            createdAt: serverTimestamp()
        }, { merge: true });
        return result.user;
    } catch (e) {
        console.error("Login failed", e);
    }
}

export const logout = async () => signOut(auth);

// Follow System
export const followEntity = async (userId: string, entityId: string, entityType: 'team' | 'league', entityName: string, entityLogo: string) => {
    try {
        const followId = `${entityType}_${entityId}`;
        const followRef = doc(db, 'users', userId, 'follows', followId);
        await setDoc(followRef, {
            userId,
            entityId: String(entityId),
            entityType,
            entityName,
            entityLogo,
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Follow failed", e);
    }
}

export const unfollowEntity = async (userId: string, entityId: string, entityType: 'team' | 'league') => {
     try {
         const followId = `${entityType}_${entityId}`;
         const followRef = doc(db, 'users', userId, 'follows', followId);
         await deleteDoc(followRef);
     } catch (e) {
         console.error("Unfollow failed", e);
     }
}

export const getFollows = async (userId: string) => {
    try {
        const followsRef = collection(db, 'users', userId, 'follows');
        const snap = await getDocs(followsRef);
        return snap.docs.map(d => d.data());
    } catch (e) {
        console.error("Get follows failed", e);
        return [];
    }
}
