# element-detector

Detect DOM elements the moment they appear and react instantly. `element-detector` wraps the
browser's [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
API with a tiny, ergonomic helper that works with callbacks, promises, and AbortSignals.

## Table of contents

- [Features](#features)
- [Installation](#installation)
  - [Bundlers](#bundlers)
  - [Userscripts](#userscripts)
- [Quick start](#quick-start)
- [Usage patterns](#usage-patterns)
  - [Callback watcher](#callback-watcher)
  - [Promise helper](#promise-helper)
- [API reference](#api-reference)
  - [`detect(selector, callback?, options?)`](#detectselector-callback-options)
  - [Options](#options)
  - [Return values](#return-values)
  - [TypeScript generics](#typescript-generics)
- [Recipes](#recipes)
- [Browser support](#browser-support)

## Features

- ✅ **Zero-setup element observation** – start listening for DOM nodes with a single call
- ⚙️ **Flexible delivery** – use callbacks for streaming updates or promises for one-off waits
- 🛑 **Full lifecycle control** – cancel with `AbortController`, timeouts, or stop manually
- 🧠 **Type-safe** – ships TypeScript typings and generic helpers for element narrowing
- 🪄 **Lightweight** – depends only on built-in web APIs; perfect for scripts and bundles alike

## Installation

### Bundlers

```bash
npm install element-detector
```

Import the package from ESM, CommonJS, or TypeScript projects:

```typescript
import {detect} from 'element-detector';
```

### Userscripts

Load the global build from a CDN in your metadata block:

```javascript
// ==UserScript==
// @name         My Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Example userscript using element-detector
// @require      https://cdn.jsdelivr.net/npm/element-detector/dist/index.global.min.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const {detect} = window.ElementDetector;

  detect('.some-element', (element) => {
    console.log('Element found:', element);
  });
})();
```

Alternative CDN builds:

- jsDelivr: [`dist/index.global.min.js`](https://cdn.jsdelivr.net/npm/element-detector/dist/index.global.min.js) (minified)
- jsDelivr: [`dist/index.global.js`](https://cdn.jsdelivr.net/npm/element-detector/dist/index.global.js) (unminified)
- unpkg: [`dist/index.global.min.js`](https://unpkg.com/element-detector/dist/index.global.min.js) (minified)
- unpkg: [`dist/index.global.js`](https://unpkg.com/element-detector/dist/index.global.js) (unminified)

## Quick start

Wait for a notification panel to appear and handle it once:

```typescript
import {detect} from 'element-detector';

detect('.notification').then((element) => {
  console.log('Notification appeared:', element);
});
```

## Usage patterns

### Callback watcher

Use a callback to act on **every** matching element, including future ones:

```typescript
import {detect} from 'element-detector';

const stopWatching = detect('.toast', (toast) => {
  console.log('New toast:', toast);
});

// Stop manually when you are done
stopWatching.stop();
```

Enable existing element processing when the page already contains matches:

```typescript
detect('.toast', (toast) => {
  hydrateToast(toast);
}, {existing: true});
```

### Promise helper

Omit the callback to receive a Promise that resolves with the first matching element. By default
promises stop observing after the first match:

```typescript
const modal = await detect('.modal');
modal.classList.add('is-visible');
```

Add a timeout to surface fallbacks:

```typescript
try {
  const modal = await detect('.modal', {timeout: 5000});
  modal.classList.add('is-visible');
} catch (error) {
  showFallbackModal();
}
```

## API reference

### `detect(selector, callback?, options?)`

| Parameter  | Type                         | Required | Description |
|------------|------------------------------|----------|-------------|
| `selector` | `string`                     | ✅        | CSS selector used to match elements. |
| `callback` | `(element: T) => void`       | ❌        | Invoked for each matched element. When omitted a Promise is returned. |
| `options`  | `DetectOptions<T>`           | ❌        | Configuration flags controlling observation behaviour. |

### Options

```typescript
interface DetectOptions<T extends Element = Element> {
  existing?: boolean;
  filter?: (element: T) => boolean;
  once?: boolean;
  timeout?: number;
  signal?: AbortSignal;
}
```

| Option      | Type                    | Default | Notes |
|-------------|-------------------------|---------|-------|
| `existing`  | `boolean`               | `false` | Process matching elements already present before observation starts. |
| `filter`    | `(element: T) => boolean` | `undefined` | Gate matches with custom logic. Returning `false` skips the element. |
| `once`      | `boolean`               | `false` | Stop after the first processed element and call `stop()`. Promises implicitly set this to `true`. |
| `timeout`   | `number` (ms)           | `undefined` | Auto-stop after the specified time. Internally uses `AbortController`. |
| `signal`    | `AbortSignal`           | `undefined` | Abort externally controlled observation. Useful for coordination with navigation or route changes. |

### Return values

- `Detector` – returned when a callback is supplied.
  - `signal: AbortSignal` – dispatched when watching stops for any reason.
  - `stop(): void` – end observation immediately.
- `Promise<T>` – returned when no callback is supplied. Resolves with the first matched element
  (equivalent to `{once: true}`).

### TypeScript generics

Provide the expected element type to unlock DOM-specific properties without casting:

```typescript
detect<HTMLButtonElement>('.submit', (button) => {
  button.disabled = false;
});

detect<HTMLAnchorElement>('a', (link) => {
  console.log(link.href);
});

const heroImage = await detect<HTMLImageElement>('img.hero');
```

## Recipes

A few practical scenarios that combine the API options:

- **Initialize widgets on arrival**
  ```typescript
  detect('.date-picker', (element) => {
    new DatePicker(element);
  }, {existing: true});
  ```

- **Wait for dynamic inventory**
  ```typescript
  const item = await detect('.product[data-id="12345"]', {
    timeout: 10000,
  });

  item.scrollIntoView({block: 'center'});
  ```

- **Enhance external links only**
  ```typescript
  detect('a', (link) => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  }, {
    filter: (link) => link.hostname !== window.location.hostname,
    existing: true,
  });
  ```

- **Manual cancellation with AbortController**
  ```typescript
  const controller = new AbortController();

  const detector = detect('.live-update', (update) => {
    processUpdate(update);
  }, {signal: controller.signal});

  document.addEventListener('navigate', () => {
    controller.abort();
  });
  ```

- **Timeout fallback**
  ```typescript
  const detector = detect('.slow-widget', (widget) => {
    initialize(widget);
  }, {timeout: 5000});

  detector.signal.addEventListener('abort', () => {
    showFallback();
  });
  ```

## Browser support

`element-detector` relies on modern DOM APIs that are widely supported in evergreen browsers:

- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [`AbortSignal.any()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)
- [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

Check the latest compatibility data at
[Can I use](https://caniuse.com/mutationobserver,abortcontroller,mdn-api_abortsignal_any_static,promises).

For legacy environments lacking these features, consider loading lightweight polyfills before
initialising the detector.
