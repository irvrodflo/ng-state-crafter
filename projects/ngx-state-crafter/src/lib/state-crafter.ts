import { computed, effect, EffectRef, Signal, signal, untracked } from '@angular/core';

import { PartialState, SignalState, StateUpdater } from './interfaces';

export class StateCrafter<T extends object> {
  protected readonly _state: SignalState<T>;
  private readonly _initial: T;

  constructor(initial: T) {
    this._state = this.createState(initial);
    this._initial = structuredClone(initial);
  }

  public update(updater: StateUpdater<T>): void {
    const snapshot = this.snapshot();
    const partial = typeof updater === 'function' ? updater(snapshot) : updater;

    for (const key in partial) {
      this.internalUpdate(key, partial);
    }
  }

  public snapshot(): T {
    return Object.keys(this._state).reduce((acc, key) => {
      acc[key as keyof T] = this._state[key as keyof T]();
      return acc;
    }, {} as T);
  }

  public select<K extends keyof T>(key: K): Signal<T[K]> {
    return this._state[key];
  }

  public computed<R>(projector: (state: T) => R): Signal<R> {
    const proxy = this.buildProxy();
    return computed(() => projector(proxy));
  }

  public effect(fn: (state: T) => void): EffectRef {
    const proxy = this.buildProxy();
    return effect(() => {
      this.snapshot();
      untracked(() => fn(proxy));
    });
  }

  public reset(): void {
    this.update(this._initial);
  }

  public when(predicate: (state: T) => boolean, fn: () => void): EffectRef {
    return effect(() => {
      const result = predicate(this.buildProxy());
      untracked(() => {
        if (!result) return;
        fn();
      });
    });
  }

  public merge<K extends keyof T>(key: K, partial: Partial<T[K]>): void {
    this._state[key].set({
      ...this._state[key](),
      ...partial,
    });
  }

  public watch<K extends keyof T>(key: K, fn: (value: T[K]) => void): EffectRef {
    return effect(() => {
      const value = this._state[key]();
      untracked(() => fn(value));
    });
  }

  public debug<K extends keyof T>(key: K, label?: string): void {
    const sig = this._state[key];
    if (!sig) {
      console.warn(`State debug: The property "${String(key)}" not exist`);
      return;
    }

    const consoleLabel: string = `[State Debug${label ? `: ${label}` : ''}] ${String(key)} ->`;
    effect(() => {
      console.log(consoleLabel, sig());
    });
  }

  private createState<S extends object>(initial: S): SignalState<S> {
    const state = {} as SignalState<S>;

    for (const key in initial) {
      state[key] = signal(initial[key]);
    }

    return state;
  }

  private internalUpdate(key: Extract<keyof T, string>, partial: PartialState<T>) {
    const current = this._state[key]?.();
    const next = partial[key];
    const isFunction = typeof next === 'function';

    if (!isFunction) {
      this._state[key]?.set(next as T[typeof key]);
      return;
    }

    const newValue = (next as (v: any) => any)(current);
    this._state[key]?.set(newValue);
  }

  private buildProxy(): T {
    const state = this._state;
    return new Proxy({} as T, {
      get: (_, key: string | symbol) => {
        if (typeof key !== 'string') return undefined;
        return state[key as keyof T]?.();
      },
    });
  }
}
