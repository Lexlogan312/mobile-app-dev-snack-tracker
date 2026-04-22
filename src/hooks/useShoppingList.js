import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAdmin } from './useAdmin';

export const useShoppingList = () => {
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const q = query(collection(db, 'shoppingList'), orderBy('addedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShoppingList(listData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addItem = async (item) => {
    if (!isAdmin) return;
    await addDoc(collection(db, 'shoppingList'), {
      ...item,
      isPurchased: false,
      addedAt: serverTimestamp(),
    });
  };

  const togglePurchased = async (id, currentStatus) => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'shoppingList', id), {
      isPurchased: !currentStatus
    });
  };

  const clearPurchased = async () => {
    if (!isAdmin) return;
    const batch = writeBatch(db);
    const purchasedItems = shoppingList.filter(item => item.isPurchased);
    
    purchasedItems.forEach(item => {
      const itemRef = doc(db, 'shoppingList', item.id);
      batch.delete(itemRef);
    });
    
    await batch.commit();
  };

  const removeItem = async (id) => {
    if (!isAdmin) return;
    await deleteDoc(doc(db, 'shoppingList', id));
  };

  return { shoppingList, loading, addItem, togglePurchased, clearPurchased, removeItem };
};
