# element-detector

A library for detecting elements appearing in the DOM. Executes callbacks when elements matching a selector are added to the page.

Uses [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to efficiently track DOM changes and notify about new elements. Works at any stage of page lifecycle - during initial load, after DOMContentLoaded, or during dynamic content updates.

## Installation

```bash
npm install element-detector
```

## Usage

### With callback

```typescript
import {detect} from 'element-detector';

// Called for each new element matching the selector
detect('.notification', (element) => {
  console.log('New notification:', element);
});
```

### Without callback (Promise)

```typescript
import {detect} from 'element-detector';

// Returns a promise that resolves with the first matching element
const modal = await detect('.modal');
console.log('Modal appeared:', modal);
```

## API

### `detect(selector, callback?, options?)`

#### Parameters

**selector**: `string`

- CSS selector to match elements

**callback**: `(element: T) => void` (optional)

- Function called for each matching element
- If omitted, returns a Promise

**options**: `DetectOptions<T>` (optional)

- Configuration object

#### Returns

- `Detector` - when callback is provided
- `Promise<T>` - when callback is omitted (defaults to `{ once: true }`)

### Options

**existing**: `boolean` (default: `false`)

- When `true`, processes elements that already exist in the DOM at the time `detect` is called
- When `false`, only processes elements added after the call

```typescript
detect('.item', callback, {existing: true});
```

**once**: `boolean` (default: `false`)

- When `true`, stops watching after the first matching element
- Automatically calls `stop()` on the detector

```typescript
detect('.dialog', callback, {once: true});
```

**filter**: `(element: T) => boolean`

- Additional filtering function applied to matched elements
- Only elements for which the function returns `true` will trigger the callback

```typescript
detect('a', callback, {
  filter: (link) => link.hostname !== window.location.hostname
});
```

**timeout**: `number`

- Time in milliseconds after which watching automatically stops
- Creates an internal AbortController that triggers after the specified time

```typescript
detect('.widget', callback, {timeout: 5000});
```

**signal**: `AbortSignal`

- External AbortSignal for manual control
- When the signal is aborted, watching stops

```typescript
const controller = new AbortController();
detect('.element', callback, {signal: controller.signal});

// Later
controller.abort();
```

### TypeScript Generics

Specify element type for proper typing:

```typescript
detect<HTMLButtonElement>('.submit', (button) => {
  button.disabled = false;
});

detect<HTMLAnchorElement>('a', (link) => {
  console.log(link.href);
});

const img = await detect<HTMLImageElement>('img.hero');
```

### Interfaces

```typescript
interface DetectOptions<T extends Element = Element> {
  existing?: boolean;
  filter?: (element: T) => boolean;
  once?: boolean;
  timeout?: number;
  signal?: AbortSignal;
}

interface Detector {
  signal: AbortSignal;  // Fires when watching stops
  stop: () => void;     // Manually stop watching
}
```

## Examples

### Initializing widgets

```typescript
detect('.date-picker', (element) => {
  new DatePicker(element);
}, {existing: true});
```

### Waiting for dynamic content

```typescript
const item = await detect('.product[data-id="12345"]', {
  timeout: 10000
});

item.scrollIntoView();
```

### Modal dialogs

```typescript
detect('.modal.confirmation', (modal) => {
  const confirmBtn = modal.querySelector('.confirm');
  confirmBtn?.addEventListener('click', handleConfirm);
});
```

### Processing external links

```typescript
detect('a', (link) => {
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
}, {
  filter: (link) => link.hostname !== window.location.hostname,
  existing: true
});
```

### Timeout with fallback

```typescript
const detector = detect('.slow-widget', (widget) => {
  initialize(widget);
}, {timeout: 5000});

detector.signal.addEventListener('abort', () => {
  showFallback();
});
```

### Manual control with AbortController

```typescript
const controller = new AbortController();

detect('.live-update', (update) => {
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

const detector = detect('.element', callback, {
  signal: controller.signal,
  timeout: 10000
});

// Stops when either timeout is reached OR controller.abort() is called
// detector.signal combines both signals
```

### Waiting for third-party scripts

```typescript
const widget = await detect('.third-party-widget', {
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
