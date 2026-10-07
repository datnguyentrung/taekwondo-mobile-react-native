import mqtt, { type MqttClient } from 'mqtt';

import type { MessageHandler, MqttMessage, MqttService } from './mqtt.types';

const RECONNECT_PERIOD_MS = 3_000;
const CONNECT_TIMEOUT_MS = 10_000;

function parsePayload(rawPayload: string): unknown {
  try {
    return JSON.parse(rawPayload) as unknown;
  } catch {
    return rawPayload;
  }
}

function isWebSocketBrokerUrl(brokerUrl: string): boolean {
  return brokerUrl.startsWith('ws://') || brokerUrl.startsWith('wss://');
}

export class MqttClientAdapter implements MqttService {
  private client: MqttClient | null = null;
  private brokerUrl: string | null = null;
  private readonly handlers = new Map<string, Set<MessageHandler>>();

  connect(brokerUrl: string): void {
    const normalizedBrokerUrl = brokerUrl.trim();
    if (!normalizedBrokerUrl) {
      this.warn('MQTT is disabled because mqttBrokerUrl is not configured.');
      return;
    }

    if (!isWebSocketBrokerUrl(normalizedBrokerUrl)) {
      this.warn('MQTT broker URL must use ws:// or wss:// for Expo clients.');
      return;
    }

    if (this.client && this.brokerUrl === normalizedBrokerUrl) {
      return;
    }

    this.disconnectClient(false);
    this.brokerUrl = normalizedBrokerUrl;
    this.client = mqtt.connect(normalizedBrokerUrl, {
      clean: true,
      reconnectPeriod: RECONNECT_PERIOD_MS,
      connectTimeout: CONNECT_TIMEOUT_MS,
    });

    this.client.on('connect', () => {
      this.subscribeAll();
    });

    this.client.on('message', (topic, message) => {
      const topicHandlers = this.handlers.get(topic);
      if (!topicHandlers?.size) return;

      const rawPayload = message.toString();
      const mqttMessage: MqttMessage = {
        topic,
        rawPayload,
        payload: parsePayload(rawPayload),
        receivedAt: new Date(),
      };
      for (const handler of topicHandlers) {
        handler(mqttMessage);
      }
    });

    this.client.on('error', (error) => {
      console.warn('[MQTT] connection error', error);
    });
  }

  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
      if (this.client?.connected) {
        this.subscribeTopic(topic);
      }
    }

    this.handlers.get(topic)?.add(handler);

    return () => {
      const topicHandlers = this.handlers.get(topic);
      topicHandlers?.delete(handler);
      if (topicHandlers && topicHandlers.size === 0) {
        this.handlers.delete(topic);
        this.client?.unsubscribe(topic);
      }
    };
  }

  publish(topic: string, message: string): void {
    if (this.client?.connected) {
      this.client.publish(topic, message);
    } else {
      this.warn('Cannot publish because MQTT is not connected.');
    }
  }

  disconnect(): void {
    this.disconnectClient(true);
  }

  private subscribeAll(): void {
    for (const topic of this.handlers.keys()) {
      this.subscribeTopic(topic);
    }
  }

  private subscribeTopic(topic: string): void {
    this.client?.subscribe(topic, (error) => {
      if (error) console.warn(`[MQTT] unable to subscribe to ${topic}`, error);
    });
  }

  private disconnectClient(clearHandlers: boolean): void {
    this.client?.end(true);
    this.client = null;
    this.brokerUrl = null;
    if (clearHandlers) this.handlers.clear();
  }

  private warn(message: string): void {
    if (__DEV__) console.warn(`[MQTT] ${message}`);
  }
}

export const mqttClient = new MqttClientAdapter();
