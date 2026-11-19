export type MqttMessage = {
  topic: string;
  rawPayload: string;
  payload: unknown;
  receivedAt: Date;
};

export type MessageHandler = (message: MqttMessage) => void;
export type MqttConnection = {
  brokerUrl: string;
  username: string;
  password: string;
  clientId: string;
  onConnected?: () => void;
  onAuthRejected?: () => void;
};

export interface MqttService {
  connect: (connection: MqttConnection | string) => void;
  subscribe: (topic: string, handler: MessageHandler) => () => void;
  publish: (topic: string, message: string) => void;
  disconnect: () => void;
}
