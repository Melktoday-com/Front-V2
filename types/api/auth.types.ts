export interface RequestOtpRequest {
    mobileNumber: string;
}

export interface RequestOtpResponse {
    sent: boolean;
    expiresInSeconds: number;
}

export interface VerifyOtpRequest {
    mobileNumber: string;
    otp: string;
}

export interface VerifyOtpResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId: string;
    isNewUser: boolean;
}

export interface TerminateSessionRequest {
    sessionId: string;
}

export interface TerminateSessionResponse {
    sessionId: string;
    terminated: boolean;
}

export interface SwitchActiveRoleRequest {
    sessionId: string;
    roleName: string;
}

export interface SwitchActiveRoleResponse {
    sessionId: string;
    activeRoleId: string;
    roleName: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface JwtPayload {
    sub: string;
    sessionId: string;
    activeRoleId: string | null;
    activeRoleName: string | null;
    type: 'access' | 'refresh';
    iat: number;
    exp: number;
}
