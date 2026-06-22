import {
    afterEach,
    vi,
} from "vitest";

import {
    cleanup,
} from "@testing-library/react";

import "@testing-library/jest-dom/vitest";

afterEach(() => {
    cleanup();
});

Object.defineProperty(
    window,
    "matchMedia",
    {
        writable: true,

        value: vi.fn().mockImplementation(
            (query: string) => ({
                matches: false,
                media: query,
                onchange: null,

                addListener:
                    vi.fn(),

                removeListener:
                    vi.fn(),

                addEventListener:
                    vi.fn(),

                removeEventListener:
                    vi.fn(),

                dispatchEvent:
                    vi.fn(),
            })
        ),
    }
);

class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}

class IntersectionObserverMock {
    root = null;
    rootMargin = "0px";
    thresholds = [0];

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(
        () => []
    );
}

vi.stubGlobal(
    "ResizeObserver",
    ResizeObserverMock
);

vi.stubGlobal(
    "IntersectionObserver",
    IntersectionObserverMock
);