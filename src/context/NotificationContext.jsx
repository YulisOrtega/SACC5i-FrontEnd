/**
 * Context y Provider para sistema de notificaciones
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

const MAX_STORED_NOTIFICATIONS = 150;
const MAX_VISIBLE_NOTIFICATIONS = 4;
const DUPLICATE_SUPPRESSION_MS = 1200;
const MAX_SIGNATURE_CACHE_SIZE = 300;
const NOTIFICATION_STORAGE_KEY = 'sacc5i.notification.history';

const getStoredUserId = () => {
  if (typeof window === 'undefined') return null;

  const keys = [
    'user',
    'usuario',
    'authUser',
    'sacc5i.user',
    'sacc5i.auth.user'
  ];

  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const id =
        parsed?.id ||
        parsed?.usuario_id ||
        parsed?.user?.id ||
        parsed?.usuario?.id ||
        parsed?.data?.id ||
        parsed?.data?.usuario_id;

      if (id) return id;
    } catch {
      // Ignorar keys que no sean JSON.
    }
  }

  const tokenKeys = ['token', 'authToken', 'accessToken', 'sacc5i.token'];

  for (const key of tokenKeys) {
    const token = window.localStorage.getItem(key);
    if (!token || !token.includes('.')) continue;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const id = payload?.id || payload?.usuario_id || payload?.user_id;
      if (id) return id;
    } catch {
      // Ignorar tokens inválidos.
    }
  }

  return null;
};

const mapBackendNotificationType = (tipo) => {
  if (tipo === 'respuesta_c3') return 'info';
  if (['success', 'error', 'warning', 'info'].includes(tipo)) return tipo;
  return 'info';
};

const normalizeBackendNotification = (item) => {
  if (!item) return null;

  const message = String(item.mensaje || item.message || '').trim();
  if (!message) return null;

  return {
    id: `db-${item.id}`,
    backendId: item.id,
    title: item.titulo || item.title || null,
    message,
    type: mapBackendNotificationType(item.tipo || item.type),
    timestamp: item.created_at || item.timestamp || new Date().toISOString(),
    read: Boolean(item.leida || item.read),
    url: item.url || null,
    referencia_tipo: item.referencia_tipo || null,
    referencia_id: item.referencia_id || null,
    persona_id: item.persona_id || null
  };
};

const getNotificationSignature = (type, message) => {
  return `${type}:${String(message || '').trim().toLowerCase()}`;
};

const sanitizeStoredNotification = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const validTypes = ['success', 'error', 'warning', 'info'];
  const message = typeof item.message === 'string' && item.message.trim()
    ? item.message.trim()
    : null;

  if (!message) {
    return null;
  }

  const type = validTypes.includes(item.type) ? item.type : 'info';
  const timestamp = typeof item.timestamp === 'string' && !Number.isNaN(new Date(item.timestamp).getTime())
    ? item.timestamp
    : new Date().toISOString();

  return {
    id: typeof item.id === 'string' && item.id ? item.id : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    backendId: item.backendId || null,
    title: typeof item.title === 'string' ? item.title : null,
    message,
    type,
    timestamp,
    read: Boolean(item.read),
    url: typeof item.url === 'string' ? item.url : null,
    referencia_tipo: item.referencia_tipo || null,
    referencia_id: item.referencia_id || null,
    persona_id: item.persona_id || null
  };
};

const getInitialNotificationHistory = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(sanitizeStoredNotification)
      .filter(Boolean)
      .slice(0, MAX_STORED_NOTIFICATIONS);
  } catch {
    return [];
  }
};

/**
 * Generar ID único para notificaciones
 */
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const NotificationContext = createContext(null);

/**
 * Hook para usar notificaciones
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
};

/**
 * Provider de notificaciones
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState(getInitialNotificationHistory);

  const notificationsRef = useRef([]);
  const notificationHistoryRef = useRef([]);
  const notificationTimeoutsRef = useRef(new Map());
  const notificationSignatureRef = useRef(new Map());
  const backendToastShownRef = useRef(new Set());
  const initialBackendLoadDoneRef = useRef(false);

  const cargarNotificacionesBackend = useCallback(async () => {
    try {
      const usuarioId = getStoredUserId();

      if (!usuarioId) {
        return;
      }

      const response = await api.get('/notificaciones', {
        params: {
          usuario_id: usuarioId,
          limit: 30
        }
      });

      const lista = response.data?.data?.notificaciones || [];

      // Solo traemos las NO leídas para que las viejas no vuelvan a aparecer.
      const normalizadas = lista
        .filter((item) => Number(item.leida || 0) === 0)
        .map(normalizeBackendNotification)
        .filter(Boolean);

      const nuevasParaToast = initialBackendLoadDoneRef.current
        ? normalizadas.filter((item) => !backendToastShownRef.current.has(item.id))
        : [];

      normalizadas.forEach((item) => {
        backendToastShownRef.current.add(item.id);
      });

      initialBackendLoadDoneRef.current = true;

      // Esto hace que salga la notificación lateral.
      if (nuevasParaToast.length > 0) {
        setNotifications((prev) => {
          const idsNuevas = new Set(nuevasParaToast.map((item) => item.id));
          const prevSinDuplicados = prev.filter((item) => !idsNuevas.has(item.id));

          const nuevasVisibles = nuevasParaToast.map((item) => ({
            ...item,
            dismissible: true,
            signature: getNotificationSignature(item.type, item.message)
          }));

          return [...nuevasVisibles, ...prevSinDuplicados].slice(0, MAX_VISIBLE_NOTIFICATIONS);
        });

        if (typeof window !== 'undefined') {
          nuevasParaToast.forEach((item) => {
            const timeoutId = window.setTimeout(() => {
              setNotifications((prev) => prev.filter((notification) => notification.id !== item.id));
              notificationTimeoutsRef.current.delete(item.id);
            }, 7000);

            notificationTimeoutsRef.current.set(item.id, timeoutId);
          });
        }
      }

      setNotificationHistory((prev) => {
        // Quitamos notificaciones de BD anteriores y dejamos solo las nuevas no leídas.
        // Las locales normales se conservan.
        const locales = prev.filter((item) => !item.backendId);

        return [...normalizadas, ...locales].slice(0, MAX_STORED_NOTIFICATIONS);
      });
    } catch (error) {
      console.warn(
        'No se pudieron cargar notificaciones del backend:',
        error.response?.data?.message || error.message
      );
    }
  }, []);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    notificationHistoryRef.current = notificationHistory;
  }, [notificationHistory]);

  useEffect(() => {
      // 1. Esta es la clave: La llamamos inmediatamente al entrar a la pantalla
      cargarNotificacionesBackend();

      // 2. Y aquí configuramos el temporizador para que busque silenciosamente cada 30 segundos (30000 ms)
      const timer = window.setInterval(() => {
        cargarNotificacionesBackend();
      }, 30000); 

      // 3. Limpiamos la basura cuando el usuario cierra sesión o cambia de pantalla
      return () => {
        window.clearInterval(timer);
      };
    }, []); 

  const clearNotificationTimer = useCallback((id) => {
    const timerId = notificationTimeoutsRef.current.get(id);
    if (!timerId || typeof window === 'undefined') return;

    window.clearTimeout(timerId);
    notificationTimeoutsRef.current.delete(id);
  }, []);

  const rememberSignature = useCallback((signature, timestamp) => {
    const cache = notificationSignatureRef.current;

    if (cache.has(signature)) {
      cache.delete(signature);
    }

    cache.set(signature, timestamp);

    if (cache.size > MAX_SIGNATURE_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
  }, []);

  const removeNotification = useCallback((id) => {
    clearNotificationTimer(id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, [clearNotificationTimer]);

  const scheduleNotificationRemoval = useCallback((id, duration) => {
    if (!(duration > 0) || typeof window === 'undefined') {
      return;
    }

    clearNotificationTimer(id);

    const timeoutId = window.setTimeout(() => {
      removeNotification(id);
    }, duration);

    notificationTimeoutsRef.current.set(id, timeoutId);
  }, [clearNotificationTimer, removeNotification]);

  const marcarBackendComoLeida = useCallback(async (backendId) => {
    try {
      const usuarioId = getStoredUserId();

      if (!backendId || !usuarioId) {
        return;
      }

      await api.patch(`/notificaciones/${backendId}/leida`, {}, {
        params: {
          usuario_id: usuarioId
        }
      });
    } catch (error) {
      console.warn(
        'No se pudo marcar la notificación como leída:',
        error.response?.data?.message || error.message
      );
    }
  }, []);

  const marcarTodasBackendComoLeidas = useCallback(async () => {
    try {
      const usuarioId = getStoredUserId();

      if (!usuarioId) {
        return;
      }

      await api.patch('/notificaciones/marcar-todas/leidas', {}, {
        params: {
          usuario_id: usuarioId
        }
      });
    } catch (error) {
      console.warn(
        'No se pudieron marcar todas las notificaciones como leídas:',
        error.response?.data?.message || error.message
      );
    }
  }, []);

  const removeFromHistory = useCallback((id) => {
    const target = notificationHistoryRef.current.find((item) => item.id === id);

    if (target?.backendId) {
      marcarBackendComoLeida(target.backendId);
    }

    setNotificationHistory((prev) => prev.filter((item) => item.id !== id));
  }, [marcarBackendComoLeida]);

  const clearHistory = useCallback(() => {
    marcarTodasBackendComoLeidas();

    setNotifications([]);
    setNotificationHistory([]);
  }, [marcarTodasBackendComoLeidas]);

  const markAsRead = useCallback((id) => {
    const target = notificationHistoryRef.current.find((item) => item.id === id);

    if (target?.backendId) {
      marcarBackendComoLeida(target.backendId);
    }

    setNotificationHistory((prev) => prev.map((item) => {
      if (item.id !== id || item.read) {
        return item;
      }

      return { ...item, read: true };
    }));
  }, [marcarBackendComoLeida]);

  const markAsUnread = useCallback((id) => {
    setNotificationHistory((prev) => prev.map((item) => {
      if (item.id !== id || !item.read) {
        return item;
      }
      return { ...item, read: false };
    }));
  }, []);

  const toggleReadStatus = useCallback((id) => {
    setNotificationHistory((prev) => prev.map((item) => (
      item.id === id ? { ...item, read: !item.read } : item
    )));
  }, []);

  const markAllAsRead = useCallback(() => {
    marcarTodasBackendComoLeidas();

    setNotificationHistory((prev) => prev.map((item) => (
      item.read ? item : { ...item, read: true }
    )));
  }, [marcarTodasBackendComoLeidas]);

  const markAllAsUnread = useCallback(() => {
    setNotificationHistory((prev) => prev.map((item) => (
      item.read ? { ...item, read: false } : item
    )));
  }, []);

  /**
   * Mostrar notificacion
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo: success, error, warning, info
   * @param {number} duration - Duracion en ms (0 = no auto-ocultar)
   * @param {object} options - Opciones avanzadas
   * @param {string} options.id - ID fijo para reemplazar una notificacion existente
   * @param {boolean} options.dismissible - Permite cerrar manualmente (default: true)
   * @param {boolean} options.keepInHistory - Guarda en historial (default: true)
   */
  const showNotification = useCallback((message, type = 'info', duration = 5000, options = {}) => {
    const safeType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const safeMessage = typeof message === 'string' && message.trim()
      ? message.trim()
      : 'Notificacion del sistema';
    const customId = typeof options?.id === 'string' && options.id.trim() ? options.id.trim() : null;
    const dismissible = options?.dismissible !== false;
    const keepInHistory = options?.keepInHistory !== false;

    const signature = getNotificationSignature(safeType, safeMessage);
    const now = Date.now();
    const existingById = customId
      ? notificationsRef.current.find((item) => item.id === customId)
      : null;
    const existingVisible = notificationsRef.current.find((item) => item.signature === signature);
    const lastShownAt = notificationSignatureRef.current.get(signature) || 0;

    if (existingById && existingById.signature === signature && existingById.type === safeType) {
      scheduleNotificationRemoval(existingById.id, duration);
      return existingById.id;
    }

    if (!customId && (existingVisible || now - lastShownAt < DUPLICATE_SUPPRESSION_MS)) {
      if (existingVisible) {
        scheduleNotificationRemoval(existingVisible.id, duration);
        return existingVisible.id;
      }
      return null;
    }

    const id = customId || generateId();
    const timestamp = new Date().toISOString();

    const baseNotification = {
      id,
      message: safeMessage,
      type: safeType,
      timestamp,
      read: false,
      dismissible
    };

    const toastNotification = {
      ...baseNotification,
      signature
    };

    rememberSignature(signature, now);

    setNotifications((prev) => {
      const nextBase = customId
        ? prev.filter((item) => item.id !== customId)
        : prev;
      const next = [...nextBase, toastNotification];
      if (next.length <= MAX_VISIBLE_NOTIFICATIONS) {
        return next;
      }

      const overflowCount = next.length - MAX_VISIBLE_NOTIFICATIONS;
      const removableIndices = [];

      for (let index = 0; index < next.length; index += 1) {
        const candidate = next[index];
        if (candidate.dismissible === false) {
          continue;
        }
        removableIndices.push(index);
      }

      if (removableIndices.length < overflowCount) {
        for (let index = 0; index < next.length && removableIndices.length < overflowCount; index += 1) {
          if (removableIndices.includes(index)) {
            continue;
          }

          const candidate = next[index];
          if (candidate.id === id) {
            continue;
          }

          removableIndices.push(index);
        }
      }

      const indicesToRemove = removableIndices
        .sort((a, b) => a - b)
        .slice(0, overflowCount);
      const indicesToRemoveSet = new Set(indicesToRemove);
      const overflowItems = next.filter((_, index) => indicesToRemoveSet.has(index));

      overflowItems.forEach((item) => {
        clearNotificationTimer(item.id);
      });

      return next.filter((_, index) => !indicesToRemoveSet.has(index));
    });

    if (keepInHistory) {
      setNotificationHistory((prev) => {
        const nextBase = customId
          ? prev.filter((item) => item.id !== customId)
          : prev;

        return [baseNotification, ...nextBase].slice(0, MAX_STORED_NOTIFICATIONS);
      });
    } else if (customId) {
      setNotificationHistory((prev) => prev.filter((item) => item.id !== customId));
    }

    scheduleNotificationRemoval(id, duration);

    return id;
  }, [clearNotificationTimer, rememberSignature, scheduleNotificationRemoval]);

  /**
   * Mostrar notificación de éxito
   */
  const success = useCallback((message, duration) => {
    return showNotification(message, 'success', duration);
  }, [showNotification]);

  /**
   * Mostrar notificación de error
   */
  const error = useCallback((message, duration = 7000) => {
    return showNotification(message, 'error', duration);
  }, [showNotification]);

  /**
   * Mostrar notificación de advertencia
   */
  const warning = useCallback((message, duration) => {
    return showNotification(message, 'warning', duration);
  }, [showNotification]);

  /**
   * Mostrar notificación informativa
   */
  const info = useCallback((message, duration) => {
    return showNotification(message, 'info', duration);
  }, [showNotification]);

  /**
   * Limpiar todas las notificaciones
   */
  const clearAll = useCallback(() => {
    if (typeof window !== 'undefined') {
      notificationTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    }
    notificationTimeoutsRef.current.clear();
    setNotifications([]);
    setNotificationHistory([]);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        notificationTimeoutsRef.current.forEach((timeoutId) => {
          window.clearTimeout(timeoutId);
        });
      }
      notificationTimeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    window.showNotification = showNotification;

    return () => {
      if (window.showNotification === showNotification) {
        delete window.showNotification;
      }
    };
  }, [showNotification]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notificationHistory));
    } catch {
      // Ignorar errores de almacenamiento para no interrumpir la experiencia.
    }
  }, [notificationHistory]);

  const unreadCount = notificationHistory.reduce((total, item) => {
    return item.read ? total : total + 1;
  }, 0);

  const value = useMemo(() => ({
    notifications,
    notificationHistory,
    unreadCount,
    totalCount: notificationHistory.length,
    showNotification,
    success,
    error,
    warning,
    info,
    removeNotification,
    clearAll,
    removeFromHistory,
    clearHistory,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    markAllAsRead,
    markAllAsUnread
  }), [
    notifications,
    notificationHistory,
    unreadCount,
    showNotification,
    success,
    error,
    warning,
    info,
    removeNotification,
    clearAll,
    removeFromHistory,
    clearHistory,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    markAllAsRead,
    markAllAsUnread
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
