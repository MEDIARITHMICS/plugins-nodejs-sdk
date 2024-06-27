import { core } from '@mediarithmics/plugins-nodejs-sdk';

export interface State {
  ts: number;
  amount: number;
}

export interface Data {
  events: State[];
}

export interface Result {
  score: number;
}

export class MyComputedField extends core.ComputedFieldPlugin<State, Data, Result> {
  constructor() {
    super();
  }

  dataReduce(data: Data): State {
    return data.events.reduce((acc, curr) => {
      return { ...acc, ...curr };
    });
  }

  onUpdate(state: State | null, data: Data): State {
    if (!state) {
      return this.dataReduce(data);
    }
    return { ...state, ...this.dataReduce(data) };
  }

  buildResult(state: State | null): {
    state: State | null;
    result: Result;
  } {
    return {
      state: state,
      result: { score: 1 },
    };
  }
}
