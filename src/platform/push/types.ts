export interface PushTokenData {
  token: string;
  installationId: string;
  platform: "ANDROID" | "IOS" | "WEB";
}

export interface PushNotificationPayload {
  title?: string;
  body?: string;
  id?: string;
  data?: {
    type?: string;
    referenceId?: string;
    targetUrl?: string;
    channelId?: string;
    [key: string]: unknown;
  };
}

export type PushNotificationCallback = (notification: PushNotificationPayload) => void;
export type NotificationActionCallback = (action: {
  actionId: string;
  notification: PushNotificationPayload;
}) => void;
