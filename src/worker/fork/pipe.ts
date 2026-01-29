/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

type DeferredData = unknown;
type HandlerData = unknown;
type PipeData = { data: unknown; state: 'fulfilled' | 'rejected' };
type CallbackData = { type: 'fulfilled' | 'rejected'; data: unknown };
type LogArgs = unknown[];

const uuid = (len = 4) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(Math.ceil(len / 2));
    return bytes.toString('hex').slice(0, len);
  } catch {
    const ts = Date.now().toString(16);
    return ts.slice(-len).padStart(len, '0');
  }
};

const callbackKey = (key: string) => key + '.callback';

class Deferred {
  resolve: (data: DeferredData) => void;
  reject: (data: DeferredData) => void;
  private _promise: Promise<DeferredData>;
  private key: string;
  constructor(key: string) {
    this._promise = new Promise((resolve, reject) => {
      this.resolve = (data: DeferredData) => {
        resolve(data);
      };
      this.reject = (data: DeferredData) => {
        reject(data);
      };
    });
    this.key = key;
  }
  promise() {
    return this._promise;
  }
  then(onfulfilled: (data: DeferredData) => void, onrejected?: (data: DeferredData) => void) {
    return this._promise.then(onfulfilled, onrejected);
  }
  catch(onrejected: (data: DeferredData) => void) {
    return this._promise.catch(onrejected);
  }
  finally(onfinally: () => void) {
    return this._promise.finally(onfinally);
  }
  with(promise: Promise<DeferredData>) {
    promise.then(this.resolve).catch(this.reject);
  }
  pipe(handler: (key: string, data: PipeData) => void) {
    const key = callbackKey(this.key);
    return this.promise()
      .then((data) => handler(key, { data, state: 'fulfilled' }))
      .catch((data) => handler(key, { data, state: 'rejected' }));
  }
}

type THandler = (data: HandlerData, deferred?: Deferred) => void;

export class Pipe {
  listener: {
    [key: string]: Array<THandler>;
  } = {};
  isClose = false;
  constructor(master = false) {
    if (!master) {
      // 接受主进程消息
      if (process.parentPort) {
        process.parentPort.on('message', (event) => {
          const { type, data, pipeId } = event.data || {};
          // logger.info("Log message");
          if (type) {
            const deferred = this.deferred(pipeId);
            if (pipeId) {
              deferred.pipe(this.call.bind(this)).catch((error: Error) => {
                logger.error("Error message");
              });
            }
            this.emit(type, data, deferred);
          }
        });
      }
    }
  }
  emit(name: string, data: any, deferred?: Deferred) {
    const listener = (this.listener[name] || []).slice();
    for (let i = 0, len = listener.length; i < len; i++) {
      listener[i](data, deferred);
    }
  }

  on(name: string, handler: THandler) {
    const events = this.listener[name] || (this.listener[name] = []);
    events.push(handler);
    return () => {
      this.off(name, handler);
    };
  }
  once(name: string, handler: THandler) {
    this.on(name, (...args) => {
      handler(...args);
      this.off(name, handler);
    });
  }
  deferred(key?: string) {
    return new Deferred(key);
  }
  callbackKey(key: string) {
    return callbackKey(key);
  }
  off(name: string, handler?: THandler) {
    if (!this.listener[name] || !handler) this.listener[name] = [];
    else this.listener[name] = this.listener[name].filter((h) => h !== handler);
  }
  /**
   * 向主线程发起通知
   * @param name 通知名称
   * @param data 通知数据
   * @param extPrams 扩展参数
   */
  call(name: string, data: any, extPrams: any = {}) {
    if (this.isClose) {
      logger.info("Log message");
      return;
    }
    if (!process.parentPort?.postMessage) {
      logger.error("Error message");
      return;
    }
    process.parentPort.postMessage({
      type: name,
      data: data,
      ...extPrams,
    });
  }
  // 向主线程发起通知,并建立响应机制
  callPromise<T = any>(name: string, data: any) {
    const pipeId = uuid(8);
    this.call(name, data, {
      pipeId,
    });
    const promise = new Promise<T>((resolve, reject) => {
      this.once(callbackKey(pipeId), (data: CallbackData) => {
        if (data.type === 'fulfilled') {
          resolve(data.data as T);
        } else {
          reject(data.data);
        }
      });
    });
    return promise;
  }
  log(...args: LogArgs) {
    this.call('log', args);
  }
  clear() {
    this.listener = {};
  }
}

export default new Pipe();
