import {GatewaySdk, IGatewaySdk} from './GatewaySdk';

// Equivalent to `IGatewaySdk[M]` but this one won't fail at compile time !
type SdkMethod<M> = IGatewaySdk[Extract<M, keyof IGatewaySdk>];

type GatewaySdkMockProps<T> = { [K in keyof T]: ReturnType<SdkMethod<K>> | ReturnType<SdkMethod<K>>[] }

type GatewaySdkMockCall<T> = {
  [K in keyof T]: {
    getArgs: (callNumber: number) => Parameters<SdkMethod<K>> | undefined
    calledTime: () => number
  }
}

export type GatewaySdkMock<T> = IGatewaySdk & {calledMethods: GatewaySdkMockCall<T>}

export const newGatewaySdkMock = <T = Partial<IGatewaySdk>>(mocks: GatewaySdkMockProps<T>): GatewaySdkMock<T> => {
  const calledArgs: { [K in keyof GatewaySdkMockProps<T>]: any[][] } = {} as any;
  const callsCounter: { [K in keyof GatewaySdkMockProps<T>]: number } = {} as any;
  const calledMethods: GatewaySdkMockCall<T> = {} as any;
  const mockedFunctions: { [K in keyof IGatewaySdk]: (...args: any[]) => Promise<any> } = {} as any;

  const allSdkMethods = (() => {
    // @ts-ignore
    const gatewaySdk = new GatewaySdk;
    return Object.getOwnPropertyNames(gatewaySdk) as Array<keyof IGatewaySdk>;
  })();

  allSdkMethods.forEach((method) => {
    const mockedMethod: keyof T | undefined = mocks[method as keyof T] ? method as keyof T : undefined;
    if (mockedMethod) {
      calledArgs[mockedMethod] = [];
      callsCounter[mockedMethod] = 0;
      calledMethods[mockedMethod] = {
        getArgs: (callNumber: number) => calledArgs[mockedMethod][callNumber] as any,
        calledTime: () => calledArgs[mockedMethod].length,
      };
    }
    mockedFunctions[method] = (...args: any[]) => {
      if (!mockedMethod) {
        throw new Error(`No mock response provided for the GatewaySdk method ${method}.`);
      }
      calledArgs[mockedMethod].push(args);
      const getMockedValue = (func: keyof GatewaySdkMockProps<T>, callCount: number): any => {
        const mock = mocks[func];
        return Array.isArray(mock) ? mock[callCount] : mock;
      };
      return getMockedValue(mockedMethod, callsCounter[mockedMethod]++);
    };
  });
  return {
    ...mockedFunctions,
    calledMethods,
  };
};
