import { core } from '@mediarithmics/plugins-nodejs-sdk';
import {
  BaseUserActivity,
  BaseUserProfile,
  BaseComputedField,
} from '../../../lib/mediarithmics/plugins/computed-field/ComputedFieldBasePlugin';

interface Event {
  basketPrice: number;
}

export interface State {
  totalSpentAmount: number;
}

export interface Result {
  score: number;
}

interface UserActivity extends BaseUserActivity {
  events: Event[];
}

interface UserProfile extends BaseUserProfile {}

interface ComputedField extends BaseComputedField {}

export class MyComputedField extends core.ComputedFieldPlugin<State, Result, UserActivity, UserProfile, ComputedField> {
  constructor() {
    super();
  }

  onUpdateActivity(state: State, userActivity: UserActivity): State {
    if (!state) {
      state = { totalSpentAmount: 0 };
    }

    userActivity.events.map((event) => (state.totalSpentAmount += event.basketPrice));

    return state;
  }
  onUpdateUserProfile(state: State, userProfile: UserProfile, operation: core.Operation): State {
    return state;
  }
  onUpdateComputedField(state: State, computedField: ComputedField): State {
    return state;
  }

  buildResult(state: State | null): Result {
    return { score: state.totalSpentAmount };
  }
}
