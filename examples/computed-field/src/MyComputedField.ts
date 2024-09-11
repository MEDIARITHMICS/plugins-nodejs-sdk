import { core } from '@mediarithmics/plugins-nodejs-sdk';

export interface Event {
  basketPrice: number;
}

export interface State {
  totalSpentAmount: number;
}

export interface Data {
  events: Event[];
}

export interface Result {
  score: number;
}

export class MyComputedField extends core.ComputedFieldPlugin<State, Data, Result> {
  constructor() {
    super();
  }

  onUpdate(state: State | null, data: Data): State {
    if (!state) {
      state = { totalSpentAmount: 0 };
    }

    data.events.map((event) => (state.totalSpentAmount += event.basketPrice));

    return state;
  }

  buildResult(state: State | null): Result {
    return { score: state.totalSpentAmount };
  }
}
