import { StateCrafter } from './state-crafter';
import { StateInstance } from './interfaces';

export function craftState<T extends object>(initial: T): StateInstance<T> {
  const stater = new StateCrafter(initial) as StateInstance<T>;

  Object.assign(stater, (stater as any)._state);

  return stater;
}
