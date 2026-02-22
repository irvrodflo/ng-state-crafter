import { WritableSignal } from '@angular/core';
import { StateCrafter } from './state-crafter';

export type SignalState<T extends object> = {
  [K in keyof T]: WritableSignal<T[K]>;
};

type ValueOrUpdater<V> = V | ((prev: V) => V);

export type PartialState<T> = {
  [K in keyof T]?: ValueOrUpdater<T[K]>;
};

export type StateUpdater<T> = PartialState<T> | ((state: T) => PartialState<T>);

export type StateInstance<T extends object> = StateCrafter<T> & SignalState<T>;
