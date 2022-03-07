export type RouterHandler = (req: RouterRequest, res: RouterResponse, next: RouterNext) => any

export type RouterRequest<E = any> = {
    request: Request
    env?: E
    ctx?: ExecutionContext
    method: string
    params: Record<string, string>
    query: Record<string, string>
    headers: Headers
    body: any
}

export type RouterResponse = {
    headers: Record<string, string>
    status?: number
    response?: Response
    body?: any
    webSocket?: WebSocket
}

export type RouterNext = () => Promise<void>

