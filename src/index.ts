/**
 * Options for configuring the detector
 */
export interface DetectOptions<T extends Element = Element> {
	/**
	 * Process existing elements that match the selector when detect is called
	 * @default false
	 */
	existing?: boolean;

	/**
	 * Additional filter function to filter elements
	 */
	filter?: (element: T) => boolean;

	/**
	 * Stop watching after the first element is found
	 * @default false
	 */
	once?: boolean;

	/**
	 * Timeout in milliseconds after which to stop watching
	 */
	timeout?: number;

	/**
	 * AbortSignal to stop watching externally
	 */
	signal?: AbortSignal;
}

/**
 * Detector object returned by detect
 */
export interface Detector {
	/**
	 * AbortSignal that fires when watching stops
	 */
	signal: AbortSignal;

	/**
	 * Stop watching for elements
	 */
	stop: () => void;
}

// Function overloads
export function detect<T extends Element = Element>(
	selector: string,
	callback: (element: T) => void,
	options?: DetectOptions<T>,
): Detector;

export function detect<T extends Element = Element>(
	selector: string,
	options?: Omit<DetectOptions<T>, "once">,
): Promise<T>;

/**
 * Detect elements matching a selector appearing in the DOM
 */
export function detect<T extends Element = Element>(
	selector: string,
	callbackOrOptions?: ((element: T) => void) | Omit<DetectOptions<T>, "once">,
	optionsParam?: DetectOptions<T>,
): Detector | Promise<T> {
	// Determine if callback was provided
	const hasCallback = typeof callbackOrOptions === "function";
	const callback = hasCallback ? callbackOrOptions : undefined;
	const options = hasCallback ? optionsParam : callbackOrOptions;

	// For Promise API, set defaults
	const finalOptions: DetectOptions<T> = hasCallback
		? { once: false, ...options }
		: { once: true, ...options };

	// Promise API - no callback provided
	if (!hasCallback) {
		return new Promise<T>((resolve, reject) => {
			const detector = detectImpl<T>(
				selector,
				(element) => {
					resolve(element);
				},
				finalOptions,
			);

			// Reject on abort (from any source: external signal, timeout, or internal)
			detector.signal.addEventListener(
				"abort",
				() => {
					reject(new Error("Detection aborted"));
				},
				{ once: true },
			);
		});
	}

	// Callback API
	return detectImpl<T>(
		selector,
		callback as (element: T) => void,
		finalOptions,
	);
}

/**
 * Internal implementation of detect
 */
function detectImpl<T extends Element = Element>(
	selector: string,
	callback: (element: T) => void,
	options: DetectOptions<T> = {},
): Detector {
	const {
		existing = false,
		filter,
		once = false,
		timeout,
		signal: externalSignal,
	} = options;

	// Create internal AbortController
	const internalController = new AbortController();

	// Combine signals if needed
	let combinedSignal: AbortSignal;
	if (externalSignal && timeout) {
		// Create timeout controller
		const timeoutController = new AbortController();
		const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

		// Combine all signals
		combinedSignal = AbortSignal.any([
			externalSignal,
			internalController.signal,
			timeoutController.signal,
		]);

		// Clear timeout when any signal aborts
		combinedSignal.addEventListener("abort", () => clearTimeout(timeoutId), {
			once: true,
		});
	} else if (externalSignal) {
		combinedSignal = AbortSignal.any([
			externalSignal,
			internalController.signal,
		]);
	} else if (timeout) {
		const timeoutController = new AbortController();
		const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
		combinedSignal = AbortSignal.any([
			internalController.signal,
			timeoutController.signal,
		]);
		combinedSignal.addEventListener("abort", () => clearTimeout(timeoutId), {
			once: true,
		});
	} else {
		combinedSignal = internalController.signal;
	}

	let observer: MutationObserver | undefined;

	// Process a single element
	const processElement = (element: T): boolean => {
		if (combinedSignal.aborted) {
			return false;
		}

		if (filter && !filter(element)) {
			return false;
		}

		callback(element);

		if (once) {
			stop();
			return true;
		}

		return false;
	};

	// Stop watching
	const stop = () => {
		if (observer) {
			observer.disconnect();
			observer = undefined;
		}
		internalController.abort();
	};

	// Handle abort
	combinedSignal.addEventListener("abort", stop, { once: true });

	// Process existing elements if requested
	if (existing) {
		const existingElements = document.querySelectorAll<T>(selector);
		for (const element of existingElements) {
			if (processElement(element)) {
				return { signal: combinedSignal, stop };
			}
		}
	}

	// Don't start observer if already aborted
	if (combinedSignal.aborted) {
		return { signal: combinedSignal, stop };
	}

	// Create MutationObserver to watch for new elements
	observer = new MutationObserver((mutations) => {
		if (combinedSignal.aborted) {
			stop();
			return;
		}

		for (const mutation of mutations) {
			// Check added nodes
			for (const node of mutation.addedNodes) {
				if (!(node instanceof Element)) {
					continue;
				}

				// Check if the node itself matches
				if (node.matches(selector)) {
					if (processElement(node as T)) {
						return;
					}
				}

				// Check descendants
				const descendants = node.querySelectorAll<T>(selector);
				for (const element of descendants) {
					if (processElement(element)) {
						return;
					}
				}
			}
		}
	});

	// Start observing
	observer.observe(document.documentElement || document.body, {
		childList: true,
		subtree: true,
	});

	return { signal: combinedSignal, stop };
}
