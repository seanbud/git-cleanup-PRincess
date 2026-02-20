export interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

export interface AuthTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
}

// Note: In Electron, these fetch calls will be handled in the main process 
// via IPC for better security and to avoid CORS issues.
// For now, defining the types and intent.

export class GitHubAuthClient {
    static async requestDeviceCode(): Promise<DeviceCodeResponse> {
        return window.electronAPI.githubStartAuth();
    }

    static async pollForToken(deviceCode: string, interval: number): Promise<string | null> {
        return new Promise((resolve) => {
            const poll = async () => {
                const token = await window.electronAPI.githubPollToken(deviceCode);
                if (token) {
                    resolve(token);
                } else {
                    setTimeout(poll, interval * 1000);
                }
            };
            poll();
        });
    }
}
