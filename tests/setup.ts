/**
 * Test setup file - adds polyfills for testing environment
 */

// Polyfill AbortSignal.any() for jsdom test environment
if (!AbortSignal.any) {
	AbortSignal.any = (signals: AbortSignal[]): AbortSignal => {
		const controller = new AbortController();

		for (const signal of signals) {
			if (signal.aborted) {
				controller.abort();
				break;
			}

			signal.addEventListener("abort", () => controller.abort(), { once: true });
		}

		return controller.signal;
	};
}
