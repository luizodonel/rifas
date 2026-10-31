import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { MensagemChat, SorteioPublico } from '../types';

let stompClient: Client | null = null;
const subscribers: Map<string, ((data: any) => void)[]> = new Map();

export function getWebSocketClient(): Client {
  if (stompClient && stompClient.active) {
    return stompClient;
  }

  const socketFactory = () => {
    return new SockJS('/ws');
  };

  stompClient = new Client({
    webSocketFactory: socketFactory,
    debug: () => {},
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    subscribers.forEach((callbacks, topic) => {
      stompClient?.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message.body);
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

function subscribeToTopic<T>(topic: string, callback: (data: T) => void): () => void {
  const client = getWebSocketClient();

  if (!subscribers.has(topic)) {
    subscribers.set(topic, []);
    if (client.connected) {
      client.subscribe(topic, (message) => {
        try {
          const payload: T = JSON.parse(message.body);
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

export function subscribeToSorteio(
  rifaId: number,
  callback: (sorteio: SorteioPublico) => void
): () => void {
  return subscribeToTopic<SorteioPublico>(`/topic/sorteio/${rifaId}`, callback);
}

export function subscribeToTodosSorteios(
  callback: (sorteio: SorteioPublico) => void
): () => void {
  return subscribeToTopic<SorteioPublico>('/topic/sorteios', callback);
}

export function subscribeToChat(
  sessaoId: string,
  callback: (msg: MensagemChat) => void
): () => void {
  return subscribeToTopic<MensagemChat>(`/topic/chat/${sessaoId}`, callback);
}

export function subscribeToAdminChat(
  callback: (msg: MensagemChat) => void
): () => void {
  return subscribeToTopic<MensagemChat>('/topic/admin/chat', callback);
}
