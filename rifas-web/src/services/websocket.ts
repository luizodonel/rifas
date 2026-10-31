import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SorteioPublico } from '../types';

let stompClient: Client | null = null;
const subscribers: Map<string, ((data: SorteioPublico) => void)[]> = new Map();

export function getWebSocketClient(): Client {
  if (stompClient && stompClient.active) {
    return stompClient;
  }

  const socketFactory = () => {
    // Usa endpoint relativo ou origin
    return new SockJS('/ws');
  };

  stompClient = new Client({
    webSocketFactory: socketFactory,
    debug: () => {
      // console.log('[STOMP]', str);
    },
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    // Reassina todos os tópicos ativos
    subscribers.forEach((callbacks, topic) => {
      stompClient?.subscribe(topic, (message) => {
        try {
          const payload: SorteioPublico = JSON.parse(message.body);
          callbacks.forEach((cb) => cb(payload));
        } catch (e) {
          console.error('Erro ao processar mensagem do WebSocket:', e);
        }
      });
    });
  };

  stompClient.activate();
  return stompClient;
}

export function subscribeToSorteio(
  rifaId: number,
  callback: (sorteio: SorteioPublico) => void
): () => void {
  const topic = `/topic/sorteio/${rifaId}`;
  const client = getWebSocketClient();

  if (!subscribers.has(topic)) {
    subscribers.set(topic, []);
    if (client.connected) {
      client.subscribe(topic, (message) => {
        try {
          const payload: SorteioPublico = JSON.parse(message.body);
          const cbs = subscribers.get(topic) || [];
          cbs.forEach((cb) => cb(payload));
        } catch (e) {
          console.error('Erro ao ler payload WebSocket:', e);
        }
      });
    }
  }

  subscribers.get(topic)!.push(callback);

  // Retorna função para cancelar assinatura (cleanup)
  return () => {
    const list = subscribers.get(topic);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }
  };
}

export function subscribeToTodosSorteios(
  callback: (sorteio: SorteioPublico) => void
): () => void {
  const topic = '/topic/sorteios';
  const client = getWebSocketClient();

  if (!subscribers.has(topic)) {
    subscribers.set(topic, []);
    if (client.connected) {
      client.subscribe(topic, (message) => {
        try {
          const payload: SorteioPublico = JSON.parse(message.body);
          const cbs = subscribers.get(topic) || [];
          cbs.forEach((cb) => cb(payload));
        } catch (e) {
          console.error('Erro ao ler payload WebSocket:', e);
        }
      });
    }
  }

  subscribers.get(topic)!.push(callback);

  return () => {
    const list = subscribers.get(topic);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }
  };
}
