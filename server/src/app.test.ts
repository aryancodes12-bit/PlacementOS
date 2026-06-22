import request from "supertest";

import {
    describe,
    expect,
    it,
} from "vitest";

import {
    app,
} from "./app";

describe(
    "PlacementOS Express application",
    () => {
        it(
            "returns API information from the root endpoint",
            async () => {
                const response =
                    await request(app)
                        .get("/")
                        .expect(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,

                    message:
                        "PlacementOS API is running",
                });
            }
        );

        it(
            "does not expose the Express framework header",
            async () => {
                const response =
                    await request(app)
                        .get("/")
                        .expect(200);

                expect(
                    response.headers[
                    "x-powered-by"
                    ]
                ).toBeUndefined();
            }
        );

        it(
            "returns JSON for an unknown API route",
            async () => {
                const response =
                    await request(app)
                        .get(
                            "/api/route-that-does-not-exist"
                        )
                        .expect(404);

                expect(
                    response.body
                ).toEqual({
                    success: false,

                    message:
                        "API route not found.",
                });
            }
        );

        it(
            "allows requests without an Origin header",
            async () => {
                await request(app)
                    .get("/")
                    .expect(200);
            }
        );

        it(
            "allows an approved frontend origin",
            async () => {
                const response =
                    await request(app)
                        .get("/")
                        .set(
                            "Origin",
                            "http://localhost:5173"
                        )
                        .expect(200);

                expect(
                    response.headers[
                    "access-control-allow-origin"
                    ]
                ).toBe(
                    "http://localhost:5173"
                );
            }
        );

        it(
            "blocks an unapproved browser origin",
            async () => {
                const response =
                    await request(app)
                        .get("/")
                        .set(
                            "Origin",
                            "https://malicious.example"
                        )
                        .expect(403);

                expect(
                    response.body
                ).toEqual({
                    success: false,

                    message:
                        "This application origin is not allowed.",
                });
            }
        );
    }
);