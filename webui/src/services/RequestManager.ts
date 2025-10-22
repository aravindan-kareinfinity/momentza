interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestManager {
  private static instance: RequestManager;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  private generateKey(method: string, url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramString}`;
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        this.pendingRequests.delete(key);
      }
    }
  }

  async executeRequest<T>(
    method: string,
    url: string,
    requestFn: () => Promise<T>,
    params?: any
  ): Promise<T> {
    this.cleanupExpiredRequests();
    
    const key = this.generateKey(method, url, params);
    
    // Check if there's already a pending request for this key
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      console.log(`[RequestManager] Reusing existing request for: ${key}`);
      return existingRequest.promise;
    }

    // Create new request
    console.log(`[RequestManager] Creating new request for: ${key}`);
    const promise = requestFn().finally(() => {
      // Remove from pending requests when completed
      this.pendingRequests.delete(key);
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  clearPendingRequests(): void {
    this.pendingRequests.clear();
  }

  getPendingRequestCount(): number {
    return this.pendingRequests.size;
  }
}

export const requestManager = RequestManager.getInstance(); 