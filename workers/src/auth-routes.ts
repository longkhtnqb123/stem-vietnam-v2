
import { Env } from './index';

export type AuthEnv = Env;

export async function handleRegister(request: Request, env: AuthEnv): Promise<Response> {
    return new Response('Auth implementation missing (stub)', { status: 501 });
}

export async function handleLogin(request: Request, env: AuthEnv): Promise<Response> {
    return new Response('Auth implementation missing (stub)', { status: 501 });
}

export async function handleMe(request: Request, env: AuthEnv): Promise<Response> {
    return new Response('Auth implementation missing (stub)', { status: 501 });
}

export async function getUserFromToken(request: Request, env: AuthEnv): Promise<any> {
    return null;
}
