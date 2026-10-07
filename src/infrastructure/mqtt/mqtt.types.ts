export type MessageHandler = (topic: string, message: Buffer | string) => void;

export interface MqttService {
  connect: (brokerUrl?: string) => void;
  subscribe: (topic: string, handler: MessageHandler) => () => void;
  publish: (topic: string, message: string | Buffer) => void;
  disconnect: () => void;
}
