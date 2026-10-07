import mqtt, { MqttClient } from 'mqtt';
import { MessageHandler, MqttService } from './mqtt.types';

class MqttClientAdapter implements MqttService {
  private client: MqttClient | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();

  connect(brokerUrl = 'mqtt://localhost:1883') {
    if (this.client?.connected) {
      return;
    }

    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      console.log('Connected MQTT Broker');
      for (const topic of this.handlers.keys()) {
        this.client?.subscribe(topic);
      }
    });

    this.client.on('message', (topic: string, message: Buffer | string) => {
      const topicHandlers = this.handlers.get(topic);
      if (topicHandlers) {
        topicHandlers.forEach((handler) => handler(topic, message));
      }
    });

    this.client.on('error', (err: Error) => {
      console.error('MQTT Error:', err);
    });
  }

  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
      if (this.client?.connected) {
        this.client.subscribe(topic);
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

  publish(topic: string, message: string | Buffer) {
    if (this.client?.connected) {
      this.client.publish(topic, message);
    } else {
      console.warn('Cannot publish: MQTT client is not connected');
    }
  }

  disconnect() {
    this.client?.end();
    this.client = null;
    this.handlers.clear();
  }
}

export const mqttClient = new MqttClientAdapter();
