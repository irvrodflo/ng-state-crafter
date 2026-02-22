# ngx-state-crafter

A lightweight, reactive state management library for Angular, built on top of Angular Signals.

**ngx-state-crafter** gives you structure without boilerplate. No actions, no reducers, no decorators — just a simple API that scales from a single component to complex feature states.

---

## Requirements

- Angular 17+

---

## Installation

```bash
npm install @irv-labs/ngx-state-crafter
```

---

## Quick Start

```typescript
import { craftState } from '@irv-labs/ngx-state-crafter';

interface CounterState {
  count: number;
  label: string;
}

const state = craftState<CounterState>({
  count: 0,
  label: 'My Counter',
});

// Read values as signals
console.log(state.count()); // 0

// Update state
state.update({ count: 1 });

// Update with a function
state.update({ count: (prev) => prev + 1 });
```

---

## API

### `craftState<T>(initial: T): StateInstance<T>`

Creates a new reactive state instance from an initial object.

```typescript
const state = craftState({ count: 0, name: 'Guest' });
```

---

### `.update(updater)`

Updates one or more properties. Accepts a partial object or a function that receives the current state.

```typescript
// Direct value
state.update({ count: 10 });

// Function updater
state.update({ count: (prev) => prev + 1 });

// Multiple properties at once
state.update({ count: 0, name: 'Alice' });

// Function that returns partial state
state.update((s) => ({ count: s.count + 1 }));
```

---

### `.select<K>(key)`

Returns the signal for a specific property.

```typescript
const count = state.select('count'); // Signal<number>
count(); // read current value
```

---

### `.computed(projector)`

Creates a derived signal from the state. Automatically updates when dependencies change.

```typescript
const doubled = state.computed((s) => s.count * 2);
const label = state.computed((s) => `${s.name}: ${s.count}`);
```

---

### `.effect(fn)`

Runs a side effect whenever the state changes. Returns an `EffectRef`.

```typescript
const ref = state.effect((s) => {
  console.log('State changed, count is:', s.count);
});

// Cleanup when done
ref.destroy();
```

---

### `.watch<K>(key, fn)`

Watches a single property and runs a callback when it changes. Returns an `EffectRef`.

```typescript
const ref = state.watch('count', (value) => {
  console.log('Count is now:', value);
});
```

---

### `.when(predicate, fn)`

Runs a callback when a condition becomes `true`. Returns an `EffectRef`.

```typescript
const ref = state.when(
  (s) => s.count > 10,
  () => console.log('Count exceeded 10!'),
);
```

---

### `.merge<K>(key, partial)`

Partially updates a nested object property without replacing the entire value.

```typescript
interface AppState {
  user: { name: string; role: string };
}

const state = craftState<AppState>({
  user: { name: 'Guest', role: 'viewer' },
});

// Only updates role, keeps name intact
state.merge('user', { role: 'admin' });
```

---

### `.snapshot()`

Returns the current state as a plain, non-reactive object.

```typescript
const snap = state.snapshot();
console.log(snap); // { count: 5, name: 'Alice' }
```

---

### `.reset()`

Resets the state back to its initial values.

```typescript
state.reset();
```

---

### `.debug<K>(key, label?)`

Logs a property's value to the console whenever it changes. Meant for development only.

```typescript
state.debug('count', 'MyComponent');
// [State Debug: MyComponent] count -> 5
```

---

## Usage in a Component

```typescript
import { Component } from '@angular/core';
import { craftState } from '@irv-labs/ngx-state-crafter';

interface FormState {
  email: string;
  submitted: boolean;
}

@Component({
  selector: 'app-form',
  template: `
    <input [value]="email()" (input)="setEmail($any($event.target).value)" />
    <button [disabled]="!isValid()" (click)="submit()">Submit</button>
  `,
})
export class FormComponent {
  state = craftState<FormState>({ email: '', submitted: false });

  email = this.state.select('email');
  isValid = this.state.computed((s) => s.email.includes('@'));

  constructor() {
    this.state.when(
      (s) => s.submitted,
      () => console.log('Form submitted!'),
    );
  }

  setEmail(value: string) {
    this.state.update({ email: value });
  }

  submit() {
    this.state.update({ submitted: true });
  }
}
```

---

## Usage in a Service

`craftState` works great inside Angular services for shared or feature-level state.

```typescript
import { Injectable } from '@angular/core';
import { craftState } from '@irv-labs/ngx-state-crafter';

interface CartState {
  items: { id: number; name: string; price: number }[];
  discount: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private state = craftState<CartState>({ items: [], discount: 0 });

  items = this.state.select('items');
  total = this.state.computed((s) => s.items.reduce((sum, i) => sum + i.price, 0) - s.discount);

  addItem(item: { id: number; name: string; price: number }) {
    this.state.update({ items: (prev) => [...prev, item] });
  }

  applyDiscount(amount: number) {
    this.state.update({ discount: amount });
  }

  reset() {
    this.state.reset();
  }
}
```

---

## TypeScript Support

`ngx-state-crafter` is fully typed. All methods infer types from your state interface automatically.

```typescript
interface MyState {
  count: number;
  name: string;
}

const state = craftState<MyState>({ count: 0, name: '' });

state.update({ count: 'oops' }); // Type error
state.select('unknown'); // Type error
state.merge('count', {}); // Type error — count is not an object
```

---

## Safety

All callbacks passed to `watch`, `when`, and `effect` are internally wrapped with `untracked`. This means you can safely read or write other signals inside these callbacks without risking infinite reactive loops.

---

## Philosophy

- **No boilerplate** — one function call to get a fully reactive state
- **Signal-native** — built entirely on Angular Signals, no RxJS required
- **Predictable** — safe by default, no surprise loops
- **Minimal API** — learn it in 10 minutes, use it anywhere

---

## License

MIT
