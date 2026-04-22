import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';

export const useConsumptionLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'consumptionLog'), orderBy('consumedAt', 'desc'), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logConsumption = async (snackId, snackName) => {
    await addDoc(collection(db, 'consumptionLog'), {
      snackId,
      snackName,
      consumedAt: serverTimestamp(),
      quantity: 1
    });
  };

  return { logs, loading, logConsumption };
};
