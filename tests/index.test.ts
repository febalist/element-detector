import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { arrive } from "../src/index";

describe("arrive", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should detect new elements added to DOM", async () => {
		const callback = vi.fn();
		arrive("button.test", callback);

		const button = document.createElement("button");
		button.className = "test";
		document.body.appendChild(button);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).toHaveBeenCalledWith(button);
	});

	it("should process existing elements when existing option is true", () => {
		const button = document.createElement("button");
		button.className = "test";
		document.body.appendChild(button);

		const callback = vi.fn();
		arrive("button.test", callback, { existing: true });

		expect(callback).toHaveBeenCalledWith(button);
	});

	it("should not process existing elements by default", () => {
		const button = document.createElement("button");
		button.className = "test";
		document.body.appendChild(button);

		const callback = vi.fn();
		arrive("button.test", callback);

		expect(callback).not.toHaveBeenCalled();
	});

	it("should filter elements using filter option", async () => {
		const callback = vi.fn();
		arrive<HTMLAnchorElement>("a", callback, {
			filter: (link) => link.href.includes("example.com"),
		});

		const link1 = document.createElement("a");
		link1.href = "https://example.com";
		document.body.appendChild(link1);

		const link2 = document.createElement("a");
		link2.href = "https://other.com";
		document.body.appendChild(link2);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(link1);
	});

	it("should stop after first element with once option", async () => {
		const callback = vi.fn();
		const watcher = arrive("button.test", callback, { once: true });

		const button1 = document.createElement("button");
		button1.className = "test";
		document.body.appendChild(button1);

		await new Promise((resolve) => setTimeout(resolve, 50));

		const button2 = document.createElement("button");
		button2.className = "test";
		document.body.appendChild(button2);

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(button1);
		expect(watcher.signal.aborted).toBe(true);
	});

	it("should stop watching when stop() is called", async () => {
		const callback = vi.fn();
		const watcher = arrive("button.test", callback);

		const button1 = document.createElement("button");
		button1.className = "test";
		document.body.appendChild(button1);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).toHaveBeenCalledTimes(1);

		watcher.stop();

		const button2 = document.createElement("button");
		button2.className = "test";
		document.body.appendChild(button2);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).toHaveBeenCalledTimes(1);
		expect(watcher.signal.aborted).toBe(true);
	});

	it("should stop watching on timeout", async () => {
		const callback = vi.fn();
		const watcher = arrive("button.test", callback, { timeout: 100 });

		await new Promise((resolve) => setTimeout(resolve, 150));

		expect(watcher.signal.aborted).toBe(true);

		const button = document.createElement("button");
		button.className = "test";
		document.body.appendChild(button);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).not.toHaveBeenCalled();
	});

	it("should respect external AbortSignal", async () => {
		const callback = vi.fn();
		const controller = new AbortController();
		arrive("button.test", callback, { signal: controller.signal });

		controller.abort();

		const button = document.createElement("button");
		button.className = "test";
		document.body.appendChild(button);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).not.toHaveBeenCalled();
	});

	it("should combine external signal with timeout", async () => {
		const callback = vi.fn();
		const controller = new AbortController();
		const watcher = arrive("button.test", callback, {
			signal: controller.signal,
			timeout: 1000,
		});

		controller.abort();

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(watcher.signal.aborted).toBe(true);
	});

	it("should return promise when no callback provided", async () => {
		setTimeout(() => {
			const button = document.createElement("button");
			button.className = "test";
			document.body.appendChild(button);
		}, 50);

		const element = await arrive<HTMLButtonElement>("button.test");
		expect(element).toBeInstanceOf(HTMLButtonElement);
		expect(element.className).toBe("test");
	});

	it("should not return existing element in promise mode by default", async () => {
		const button = document.createElement("button");
		button.className = "test";
		document.body.appendChild(button);

		const promise = arrive<HTMLButtonElement>("button.test");

		// Add a new element after a delay
		setTimeout(() => {
			const newButton = document.createElement("button");
			newButton.className = "test";
			newButton.id = "new-button";
			document.body.appendChild(newButton);
		}, 50);

		const element = await promise;
		expect(element.id).toBe("new-button");
	});

	it("should return existing element in promise mode with existing option", async () => {
		const button = document.createElement("button");
		button.className = "test";
		document.body.appendChild(button);

		const element = await arrive<HTMLButtonElement>("button.test", {
			existing: true,
		});
		expect(element).toBe(button);
	});

	it("should detect nested elements", async () => {
		const callback = vi.fn();
		arrive("button.nested", callback);

		const div = document.createElement("div");
		const button = document.createElement("button");
		button.className = "nested";
		div.appendChild(button);
		document.body.appendChild(div);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).toHaveBeenCalledWith(button);
	});

	it("should provide correct TypeScript types", () => {
		arrive<HTMLAnchorElement>("a", (link) => {
			// TypeScript should infer link as HTMLAnchorElement
			expect(typeof link.href).toBe("string");
		});

		arrive<HTMLImageElement>("img", (img) => {
			// TypeScript should infer img as HTMLImageElement
			expect(typeof img.src).toBe("string");
		});
	});

	it("should handle multiple elements added at once", async () => {
		const callback = vi.fn();
		arrive("button.test", callback);

		const fragment = document.createDocumentFragment();
		for (let i = 0; i < 3; i++) {
			const button = document.createElement("button");
			button.className = "test";
			fragment.appendChild(button);
		}
		document.body.appendChild(fragment);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).toHaveBeenCalledTimes(3);
	});

	it("should work with complex selectors", async () => {
		const callback = vi.fn();
		arrive("ul.list li a.link", callback);

		const ul = document.createElement("ul");
		ul.className = "list";
		const li = document.createElement("li");
		const a = document.createElement("a");
		a.className = "link";
		li.appendChild(a);
		ul.appendChild(li);
		document.body.appendChild(ul);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(callback).toHaveBeenCalledWith(a);
	});
});
