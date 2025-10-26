# @febalist/arrive

A library for watching elements appear in the DOM. Executes callbacks when elements matching a selector are added to the page.

Uses [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to efficiently track DOM changes and notify about new elements. Works at any stage of page lifecycle - during initial load, after DOMContentLoaded, or during dynamic content updates.

## Installation

```bash
npm install @febalist/arrive
```

## Usage

### With callback

```typescript
import {arrive} from '@febalist/arrive';

// Called for each new element matching the selector
arrive('.notification', (element) => {
  console.log('New notification:', element);
});
```

### Without callback (Promise)

```typescript
import {arrive} from '@febalist/arrive';

// Returns a promise that resolves with the first matching element
const modal = await arrive('.modal');
console.log('Modal appeared:', modal);
```

## API

### `arrive(selector, callback?, options?)`

#### Parameters

**selector**: `string`

- CSS selector to match elements

**callback**: `(element: T) => void` (optional)

- Function called for each matching element
- If omitted, returns a Promise

**options**: `ArriveOptions<T>` (optional)

- Configuration object

#### Returns

- `ArriveWatcher` - when callback is provided
- `Promise<T>` - when callback is omitted (defaults to `{ once: true }`)

### Options

**existing**: `boolean` (default: `false`)

- When `true`, processes elements that already exist in the DOM at the time `arrive` is called
- When `false`, only processes elements added after the call

```typescript
arrive('.item', callback, {existing: true});
```

**once**: `boolean` (default: `false`)

- When `true`, stops watching after the first matching element
- Automatically calls `stop()` on the watcher

```typescript
arrive('.dialog', callback, {once: true});
```

**filter**: `(element: T) => boolean`

- Additional filtering function applied to matched elements
- Only elements for which the function returns `true` will trigger the callback

```typescript
arrive('a', callback, {
  filter: (link) => link.hostname !== window.location.hostname
});
```

**timeout**: `number`

- Time in milliseconds after which watching automatically stops
- Creates an internal AbortController that triggers after the specified time

```typescript
arrive('.widget', callback, {timeout: 5000});
```

**signal**: `AbortSignal`

- External AbortSignal for manual control
- When the signal is aborted, watching stops

```typescript
const controller = new AbortController();
arrive('.element', callback, {signal: controller.signal});

// Later
controller.abort();
```

### TypeScript Generics

Specify element type for proper typing:

```typescript
arrive<HTMLButtonElement>('.submit', (button) => {
  button.disabled = false;
});

arrive<HTMLAnchorElement>('a', (link) => {
  console.log(link.href);
});

const img = await arrive<HTMLImageElement>('img.hero');
```

### Interfaces

```typescript
interface ArriveOptions<T extends Element = Element> {
  existing?: boolean;
  filter?: (element: T) => boolean;
  once?: boolean;
  timeout?: number;
  signal?: AbortSignal;
}

interface ArriveWatcher {
  signal: AbortSignal;  // Fires when watching stops
  stop: () => void;     // Manually stop watching
}
```

## Examples

### Initializing widgets

```typescript
arrive('.date-picker', (element) => {
  new DatePicker(element);
}, {existing: true});
```

### Waiting for dynamic content

```typescript
const item = await arrive('.product[data-id="12345"]', {
  timeout: 10000
});

item.scrollIntoView();
```

### Modal dialogs

```typescript
arrive('.modal.confirmation', (modal) => {
  const confirmBtn = modal.querySelector('.confirm');
  confirmBtn?.addEventListener('click', handleConfirm);
});
```

### Processing external links

```typescript
arrive('a', (link) => {
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
}, {
  filter: (link) => link.hostname !== window.location.hostname,
  existing: true
});
```

### Timeout with fallback

```typescript
const watcher = arrive('.slow-widget', (widget) => {
  initialize(widget);
}, {timeout: 5000});

watcher.signal.addEventListener('abort', () => {
  showFallback();
});
```

### Manual control with AbortController

```typescript
const controller = new AbortController();

arrive('.live-update', (update) => {
  processUpdate(update);
}, {signal: controller.signal});

// Stop watching when user leaves page section
document.addEventListener('navigate', () => {
  controller.abort();
});
```

### Combining timeout and signal

```typescript
const controller = new AbortController();

const watcher = arrive('.element', callback, {
  signal: controller.signal,
  timeout: 10000
});

// Stops when either timeout is reached OR controller.abort() is called
// watcher.signal combines both signals
```

### Waiting for third-party scripts

```typescript
const widget = await arrive('.third-party-widget', {
  timeout: 5000,
  existing: true
});

initializeIntegration(widget);
```

## Browser Support

Requires:

- [MutationObserver](https://caniuse.com/mutationobserver)
- [AbortController](https://caniuse.com/abortcontroller)
- [Promises](https://caniuse.com/promises)
