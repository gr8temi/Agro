import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import client from '../api/client';
import { queryClient } from '../api/queryClient';
import { AuthContext } from './AuthContext';
import { useNetwork } from './NetworkContext';
import { OUTBOX_TYPES, OutboxRejectedError, classifyError, errorMessage } from '../offline/outbox';

const STORAGE_KEY = 'cluckops-outbox';
const REQUEST_TIMEOUT = 20 * 1000;
// How long submit() waits for an immediate sync before treating the entry as queued.
const SUBMIT_WAIT = 15 * 1000;
const RETRY_INTERVAL = 60 * 1000;

const OutboxContext = createContext(null);

const invalidateFor = (item) => {
  const flockId = item.payload.flock;
  if (flockId != null) {
    queryClient.invalidateQueries({ queryKey: ['flock', flockId] });
    queryClient.invalidateQueries({ queryKey: ['flocks'] });
  }
  if (item.type === 'eggCollection') queryClient.invalidateQueries({ queryKey: ['eggCollections', flockId] });
  if (item.type === 'healthLog') queryClient.invalidateQueries({ queryKey: ['healthLogs', flockId] });
};

export const OutboxProvider = ({ children }) => {
  const { userToken, userInfo } = useContext(AuthContext);
  const { isOnline } = useNetwork();
  const username = userInfo?.username;

  // itemsRef is the source of truth so async sync steps never work on stale state.
  // Items are kept per username and survive logout, so they sync on the next login.
  const itemsRef = useRef([]);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const syncingRef = useRef(null);

  const commit = useCallback(async (next) => {
    itemsRef.current = next;
    setItems(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save outbox', e);
    }
  }, []);

  const updateItem = useCallback(
    (id, changes) => commit(itemsRef.current.map((i) => (i.id === id ? { ...i, ...changes } : i))),
    [commit]
  );

  const removeItem = useCallback(
    (id) => commit(itemsRef.current.filter((i) => i.id !== id)),
    [commit]
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const parsed = stored ? JSON.parse(stored) : [];
        itemsRef.current = parsed;
        setItems(parsed);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const sendItem = useCallback(async (item) => {
    try {
      await client.post(OUTBOX_TYPES[item.type].url, item.payload, { timeout: REQUEST_TIMEOUT });
      await removeItem(item.id);
      invalidateFor(item);
      return 'sent';
    } catch (error) {
      const message = errorMessage(error, item.type);
      if (classifyError(error) === 'retry') {
        await updateItem(item.id, { attempts: (item.attempts || 0) + 1, lastError: message });
        return 'retry';
      }
      await updateItem(item.id, { status: 'failed', error: message });
      return 'rejected';
    }
  }, [removeItem, updateItem]);

  // Sends this user's pending items oldest-first. Stops at the first item that
  // should be retried later so entries keep their order.
  const sync = useCallback(() => {
    if (!userToken || !username || !loaded) return Promise.resolve();
    if (syncingRef.current) return syncingRef.current;

    syncingRef.current = (async () => {
      try {
        while (true) {
          const next = itemsRef.current.find((i) => i.username === username && i.status === 'pending');
          if (!next) break;
          if ((await sendItem(next)) === 'retry') break;
        }
      } finally {
        syncingRef.current = null;
      }
    })();
    return syncingRef.current;
  }, [userToken, username, loaded, sendItem]);

  // Saves the entry, then tries to send it straight away when online.
  // Resolves { queued } and throws OutboxRejectedError if the server refuses it,
  // in which case the entry is removed so the user can fix the form.
  const submit = useCallback(async (type, payload) => {
    const id = Crypto.randomUUID();
    const item = {
      id,
      type,
      payload: { ...payload, client_id: id },
      username,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    await commit([...itemsRef.current, item]);

    if (!isOnline) return { queued: true };

    await Promise.race([sync(), new Promise((resolve) => setTimeout(resolve, SUBMIT_WAIT))]);
    const after = itemsRef.current.find((i) => i.id === id);
    if (!after) return { queued: false };
    if (after.status === 'failed') {
      await removeItem(id);
      throw new OutboxRejectedError(after.error);
    }
    return { queued: true };
  }, [username, isOnline, commit, sync, removeItem]);

  const retry = useCallback(async (id) => {
    await updateItem(id, { status: 'pending', error: null });
    return sync();
  }, [updateItem, sync]);

  // Sync when we come online, log in, or finish loading the stored queue.
  useEffect(() => {
    if (isOnline) sync();
  }, [isOnline, sync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isOnline) sync();
    });
    return () => subscription.remove();
  }, [isOnline, sync]);

  const userItems = useMemo(
    () => items.filter((i) => i.username === username),
    [items, username]
  );
  const pendingCount = userItems.filter((i) => i.status === 'pending').length;
  const failedCount = userItems.filter((i) => i.status === 'failed').length;

  // Covers server errors that don't change connectivity (e.g. a 503 during a deploy).
  useEffect(() => {
    if (!isOnline || pendingCount === 0) return undefined;
    const timer = setInterval(sync, RETRY_INTERVAL);
    return () => clearInterval(timer);
  }, [isOnline, pendingCount, sync]);

  const pendingFor = useCallback(
    (type, flockId) => userItems.filter(
      (i) => i.type === type && i.status === 'pending' && (flockId == null || i.payload.flock === flockId)
    ),
    [userItems]
  );

  const value = useMemo(() => ({
    items: userItems,
    pendingCount,
    failedCount,
    submit,
    sync,
    retry,
    discard: removeItem,
    pendingFor,
  }), [userItems, pendingCount, failedCount, submit, sync, retry, removeItem, pendingFor]);

  return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>;
};

export const useOutbox = () => useContext(OutboxContext);

// Submit handler for forms: saves (or queues) the entry, tells the user when it was
// queued, and shows the server's reason if it was rejected.
// Resolves { queued } when saved, or null when it wasn't.
export const useSubmitEntry = (type, failureTitle) => {
  const { submit } = useOutbox();
  const inFlight = useRef(false);

  return useCallback(async (payload) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    try {
      const { queued } = await submit(type, payload);
      if (queued) {
        Toast.show({
          type: 'info',
          text1: 'Saved offline',
          text2: "It will sync automatically when you're back online.",
        });
      }
      return { queued };
    } catch (error) {
      const message = error instanceof OutboxRejectedError
        ? error.message
        : 'Something went wrong. Please try again.';
      Alert.alert(failureTitle, message);
      return null;
    } finally {
      inFlight.current = false;
    }
  }, [submit, type, failureTitle]);
};
