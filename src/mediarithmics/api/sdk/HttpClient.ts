import * as request from 'request';
import {obfuscateString} from '../../utils';
import * as winston from 'winston';
import * as rp from 'request-promise-native';

interface HttpClientOptions {
  qs?: any
  body?: any
  isJson?: boolean
  isBinary?: boolean
  header?: any
}

export class HttpClient {

  constructor(
    private baseURL: string,
    private logger: () => winston.Logger,
    public options?: () => {headers?: any, auth?: any},
  ) {
  }

  readonly get = async <T = any>(uri: string, options?: HttpClientOptions) => this.request<T>('GET', uri, options);
  readonly post = async <T = any>(uri: string, options?: HttpClientOptions) => this.request<T>('POST', uri, options);
  readonly put = async <T = any>(uri: string, options?: HttpClientOptions) => this.request<T>('PUT', uri, options);
  readonly delete = async <T = any>(uri: string, options?: HttpClientOptions) => this.request<T>('DELETE', uri, options);

  async request<T = any>(
    method: string,
    uri: string,
    {header, body, qs, isJson, isBinary}: HttpClientOptions = {},
  ): Promise<T> {
    const options: request.OptionsWithUri = {
      ...this.options?.(),
      headers: {...header, ...this.options?.().headers},
      method: method,
      uri: `${this.baseURL}${uri}`,
      proxy: false,
      body,
      qs,
      json: isJson !== undefined ? isJson : true,
      encoding: isBinary !== undefined && isBinary ? null : undefined
    };
    this.logger().silly(`Doing gateway call with ${JSON.stringify(options)}`);
    try {
      const res = await rp(options);
      this.logger().debug(`[${method}] ${uri}: ${JSON.stringify(res)}`);
      return res;
    } catch (e) {
      if (e.name === 'StatusCodeError') {
        const bodyString = isJson !== undefined && !isJson ? body : JSON.stringify(body);
        throw new Error(`
          Error while calling ${method} '${uri}' with the request body '${bodyString || ''}',
          the qs '${JSON.stringify(qs) || ''}', the auth user '${obfuscateString(options.auth ? options.auth.user : undefined) || ''}',
          the auth password '${obfuscateString(options.auth ? options.auth.pass : undefined) || ''}':
          got a ${e.response.statusCode} ${e.response.statusMessage} with the response body ${JSON.stringify(e.response.body)}
        `);
      } else {
        this.logger().error(`Got an issue while doing a call at ${this.baseURL}: ${e.message} - ${e.stack}`);
        throw e;
      }
    }
  }
}