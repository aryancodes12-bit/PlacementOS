import {
    MarkerType,
} from "@xyflow/react";

import type {
    RoadmapFlowEdge,
    RoadmapFlowNode,
    RoadmapStage,
} from "../roadmap.types";

export const fullStackRoadmapStages: RoadmapStage[] =
    [
        {
            id: "stage-orientation",
            order: 0,
            slug: "orientation",
            title: "Developer Orientation",
            shortTitle: "Orientation",
            eyebrow: "Stage 0",

            summary:
                "Understand how developers work, debug, learn from documentation, and use development tools responsibly.",

            whyItMatters:
                "A strong learning process prevents tutorial dependency and helps you solve unfamiliar problems during projects and interviews.",

            estimatedTime: "1 week",
            difficulty: "BEGINNER",
            kind: "FOUNDATION",

            topics: [
                {
                    id: "developer-role",
                    title: "What full-stack developers do",
                    description:
                        "Understand frontend, backend, database, infrastructure, and product responsibilities.",
                    estimatedTime: "2 hours",
                },
                {
                    id: "terminal-basics",
                    title: "Terminal and command-line basics",
                    description:
                        "Navigate folders, run commands, inspect processes, and understand ports.",
                    estimatedTime: "4 hours",
                },
                {
                    id: "editor-debugging",
                    title: "Editor and debugging workflow",
                    description:
                        "Use breakpoints, browser tools, logs, and error traces instead of guessing.",
                    estimatedTime: "5 hours",
                    placementFocus: true,
                },
                {
                    id: "documentation",
                    title: "Reading official documentation",
                    description:
                        "Learn to find APIs, examples, constraints, and migration notes.",
                    estimatedTime: "3 hours",
                },
                {
                    id: "responsible-ai",
                    title: "Using AI responsibly",
                    description:
                        "Use AI for explanation, review, and acceleration without losing technical understanding.",
                    estimatedTime: "3 hours",
                },
            ],

            skills: [],
            checkpoint:
                "Build and run a small HTML page using only your terminal and editor.",
        },

        {
            id: "stage-web-foundations",
            order: 1,
            slug: "web-foundations",
            title: "Internet and Web Foundations",
            shortTitle: "Web Foundations",
            eyebrow: "Stage 1",

            summary:
                "Learn what happens between entering a URL and receiving a rendered web application.",

            whyItMatters:
                "HTTP, browsers, DNS, CORS, cookies, and request lifecycles appear throughout frontend, backend, debugging, security, and interviews.",

            estimatedTime: "2 weeks",
            difficulty: "BEGINNER",
            kind: "FOUNDATION",

            topics: [
                {
                    id: "internet",
                    title: "How the internet works",
                    description:
                        "Clients, servers, IP addresses, packets, routers, and network boundaries.",
                    estimatedTime: "5 hours",
                },
                {
                    id: "dns-domains",
                    title: "DNS and domains",
                    description:
                        "Domain resolution, records, subdomains, and propagation.",
                    estimatedTime: "4 hours",
                },
                {
                    id: "http",
                    title: "HTTP and HTTPS",
                    description:
                        "Methods, status codes, headers, request bodies, TLS, and certificates.",
                    estimatedTime: "8 hours",
                    placementFocus: true,
                },
                {
                    id: "browser-rendering",
                    title: "Browser rendering",
                    description:
                        "DOM, CSSOM, render tree, layout, paint, and JavaScript execution.",
                    estimatedTime: "6 hours",
                },
                {
                    id: "cookies-storage",
                    title: "Cookies and browser storage",
                    description:
                        "Cookies, localStorage, sessionStorage, sessions, and security implications.",
                    estimatedTime: "5 hours",
                    placementFocus: true,
                },
                {
                    id: "cors-rest-json",
                    title: "CORS, REST and JSON",
                    description:
                        "Origins, preflight requests, REST conventions, and JSON data exchange.",
                    estimatedTime: "7 hours",
                    placementFocus: true,
                },
            ],

            skills: [
                "HTTP",
                "REST APIs",
            ],

            checkpoint:
                "Use browser DevTools to explain every request made by a small web page.",
        },

        {
            id: "stage-html",
            order: 2,
            slug: "html",
            title: "Semantic HTML",
            shortTitle: "HTML",
            eyebrow: "Stage 2",

            summary:
                "Create accessible, structured, and search-friendly web documents.",

            whyItMatters:
                "Semantic HTML improves accessibility, SEO, maintainability, form behaviour, and browser compatibility.",

            estimatedTime: "1–2 weeks",
            difficulty: "BEGINNER",
            kind: "FRONTEND",

            topics: [
                {
                    id: "semantic-elements",
                    title: "Semantic document structure",
                    description:
                        "Use landmarks, headings, sections, articles, navigation, and meaningful elements.",
                    estimatedTime: "5 hours",
                },
                {
                    id: "forms",
                    title: "Forms and native validation",
                    description:
                        "Labels, input types, constraints, autocomplete, and accessible errors.",
                    estimatedTime: "7 hours",
                    placementFocus: true,
                },
                {
                    id: "accessibility-html",
                    title: "Accessibility foundations",
                    description:
                        "Keyboard navigation, focus order, alternative text, and semantic controls.",
                    estimatedTime: "6 hours",
                },
                {
                    id: "seo-metadata",
                    title: "Metadata and basic SEO",
                    description:
                        "Titles, descriptions, social previews, canonical metadata, and document language.",
                    estimatedTime: "4 hours",
                },
                {
                    id: "aria",
                    title: "ARIA usage",
                    description:
                        "Understand when native HTML is enough and when ARIA is necessary.",
                    estimatedTime: "4 hours",
                },
            ],

            skills: [
                "HTML5",
                "Web Accessibility",
            ],

            checkpoint:
                "Build an accessible multi-section portfolio page without a UI framework.",
            project:
                "Accessible developer portfolio",
        },

        {
            id: "stage-css",
            order: 3,
            slug: "css",
            title: "Modern CSS and Responsive Design",
            shortTitle: "CSS",
            eyebrow: "Stage 3",

            summary:
                "Design responsive interfaces using layout systems, design tokens, and maintainable styling patterns.",

            whyItMatters:
                "Strong CSS removes layout fragility and allows you to reproduce professional designs across screen sizes.",

            estimatedTime: "3 weeks",
            difficulty: "BEGINNER",
            kind: "FRONTEND",

            topics: [
                {
                    id: "cascade",
                    title: "Cascade, specificity and inheritance",
                    description:
                        "Understand how browsers resolve competing style declarations.",
                    estimatedTime: "6 hours",
                    placementFocus: true,
                },
                {
                    id: "box-model",
                    title: "Box model and positioning",
                    description:
                        "Sizing, overflow, display, positioning, stacking contexts, and containing blocks.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "flexbox-grid",
                    title: "Flexbox and Grid",
                    description:
                        "Build one-dimensional and two-dimensional layouts reliably.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "responsive-design",
                    title: "Responsive design",
                    description:
                        "Mobile-first layout, media queries, fluid sizing, and responsive typography.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "design-system",
                    title: "Design tokens and component styling",
                    description:
                        "Create consistent colours, spacing, typography, radius, and interaction states.",
                    estimatedTime: "7 hours",
                },
                {
                    id: "tailwind",
                    title: "Tailwind CSS",
                    description:
                        "Build maintainable utility-first components without abandoning CSS fundamentals.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "css-animation",
                    title: "Transitions and animations",
                    description:
                        "Create performant motion while respecting reduced-motion preferences.",
                    estimatedTime: "5 hours",
                },
            ],

            skills: [
                "CSS3",
                "Responsive Design",
                "Tailwind CSS",
            ],

            checkpoint:
                "Recreate a responsive SaaS dashboard from a reference design.",
            project:
                "Responsive product landing page and dashboard",
        },

        {
            id: "stage-javascript",
            order: 4,
            slug: "javascript",
            title: "JavaScript Fundamentals",
            shortTitle: "JavaScript",
            eyebrow: "Stage 4",

            summary:
                "Master the language, browser APIs, asynchronous execution, and runtime behaviour.",

            whyItMatters:
                "JavaScript fundamentals determine how well you understand React, Node.js, debugging, performance, and technical interviews.",

            estimatedTime: "5–7 weeks",
            difficulty: "INTERMEDIATE",
            kind: "FRONTEND",

            topics: [
                {
                    id: "js-values",
                    title: "Values, variables and types",
                    description:
                        "Primitive values, references, coercion, equality, and immutability.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "js-functions",
                    title: "Functions, scope and closures",
                    description:
                        "Function forms, lexical scope, closures, callbacks, and higher-order functions.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "arrays-objects",
                    title: "Arrays and objects",
                    description:
                        "Iteration, transformations, destructuring, copying, and object modelling.",
                    estimatedTime: "12 hours",
                },
                {
                    id: "dom-events",
                    title: "DOM and events",
                    description:
                        "DOM manipulation, propagation, delegation, forms, and browser events.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "async-js",
                    title: "Promises and async/await",
                    description:
                        "Asynchronous workflows, concurrency, errors, cancellation, and API calls.",
                    estimatedTime: "14 hours",
                    placementFocus: true,
                },
                {
                    id: "event-loop",
                    title: "Event loop",
                    description:
                        "Call stack, task queues, microtasks, rendering, and blocking operations.",
                    estimatedTime: "8 hours",
                    placementFocus: true,
                },
                {
                    id: "modules-errors",
                    title: "Modules and error handling",
                    description:
                        "ES modules, reusable boundaries, exceptions, validation, and defensive programming.",
                    estimatedTime: "8 hours",
                },
            ],

            skills: [
                "JavaScript",
                "DOM",
                "Asynchronous JavaScript",
            ],

            checkpoint:
                "Build a browser application that consumes an API and handles loading, empty, success, and error states.",
            project:
                "Vanilla JavaScript task manager",
        },

        {
            id: "stage-typescript",
            order: 5,
            slug: "typescript",
            title: "TypeScript",
            shortTitle: "TypeScript",
            eyebrow: "Stage 5",

            summary:
                "Add reliable static typing to frontend and backend application code.",

            whyItMatters:
                "TypeScript catches integration mistakes early and is widely expected in modern React and Node.js development.",

            estimatedTime: "2–3 weeks",
            difficulty: "INTERMEDIATE",
            kind: "FRONTEND",

            topics: [
                {
                    id: "ts-inference",
                    title: "Types and inference",
                    description:
                        "Primitive types, arrays, objects, inferred types, and explicit annotations.",
                    estimatedTime: "6 hours",
                },
                {
                    id: "interfaces-unions",
                    title: "Interfaces, aliases and unions",
                    description:
                        "Model application states and API payloads precisely.",
                    estimatedTime: "8 hours",
                    placementFocus: true,
                },
                {
                    id: "narrowing",
                    title: "Type narrowing",
                    description:
                        "Guards, discriminated unions, optional values, and exhaustive handling.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "generics",
                    title: "Generics and utility types",
                    description:
                        "Create reusable typed functions, services, and components.",
                    estimatedTime: "10 hours",
                    placementFocus: true,
                },
                {
                    id: "strict-mode",
                    title: "Strict mode and safe API typing",
                    description:
                        "Avoid any, model unknown input, and validate runtime boundaries.",
                    estimatedTime: "8 hours",
                },
            ],

            skills: [
                "TypeScript",
            ],

            checkpoint:
                "Convert a JavaScript application to strict TypeScript without using broad any types.",
        },

        {
            id: "stage-react",
            order: 6,
            slug: "react",
            title: "React Application Development",
            shortTitle: "React",
            eyebrow: "Stage 6",

            summary:
                "Build accessible, modular, state-driven frontend applications.",

            whyItMatters:
                "React is the primary frontend framework in the PlacementOS stack and a major interview and portfolio skill.",

            estimatedTime: "6–8 weeks",
            difficulty: "INTERMEDIATE",
            kind: "FRONTEND",

            topics: [
                {
                    id: "react-components",
                    title: "Components, props and state",
                    description:
                        "Component composition, local state, derived values, and rendering behaviour.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "react-hooks",
                    title: "Hooks and effects",
                    description:
                        "State, effects, refs, memoisation, custom hooks, and effect dependencies.",
                    estimatedTime: "16 hours",
                    placementFocus: true,
                },
                {
                    id: "react-routing",
                    title: "Routing and protected routes",
                    description:
                        "Public routes, protected pages, nested routing, and route parameters.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "react-forms",
                    title: "Forms and validation",
                    description:
                        "Controlled inputs, client validation, server errors, and accessible feedback.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "react-server-state",
                    title: "Server state with React Query",
                    description:
                        "Fetching, caching, invalidation, retries, and mutation workflows.",
                    estimatedTime: "12 hours",
                },
                {
                    id: "zustand",
                    title: "Application state with Zustand",
                    description:
                        "Small global stores, authentication state, persistence, and selectors.",
                    estimatedTime: "7 hours",
                },
                {
                    id: "react-performance",
                    title: "Performance and lazy loading",
                    description:
                        "Code splitting, memoisation, bundle analysis, and rendering optimisation.",
                    estimatedTime: "10 hours",
                },
            ],

            skills: [
                "React",
                "React Router",
                "TanStack Query",
                "Zustand",
            ],

            checkpoint:
                "Build a production-style dashboard connected to a real REST API.",
            project:
                "Placement preparation dashboard",
        },

        {
            id: "stage-node",
            order: 7,
            slug: "node-express",
            title: "Backend Development with Node.js",
            shortTitle: "Node.js",
            eyebrow: "Stage 7",

            summary:
                "Design structured REST APIs using Node.js, Express, middleware, validation, and services.",

            whyItMatters:
                "Backend engineering controls business logic, security boundaries, persistence, integrations, and application reliability.",

            estimatedTime: "6–8 weeks",
            difficulty: "INTERMEDIATE",
            kind: "BACKEND",

            topics: [
                {
                    id: "node-runtime",
                    title: "Node.js runtime",
                    description:
                        "Modules, processes, environment variables, file system, streams, and event-driven execution.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "express-routing",
                    title: "Express routing and controllers",
                    description:
                        "Routes, controllers, services, middleware, and maintainable project structure.",
                    estimatedTime: "14 hours",
                    placementFocus: true,
                },
                {
                    id: "api-design",
                    title: "REST API design",
                    description:
                        "Resources, status codes, pagination, filters, versioning, and response contracts.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "backend-validation",
                    title: "Validation and error handling",
                    description:
                        "Validate untrusted input, centralise errors, and return safe error messages.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "uploads-storage",
                    title: "File uploads and object storage",
                    description:
                        "Multipart data, validation, Cloudinary-style storage, cleanup, and access control.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "websockets",
                    title: "WebSockets and real-time events",
                    description:
                        "Socket connections, rooms, presence, disconnections, and event contracts.",
                    estimatedTime: "12 hours",
                },
                {
                    id: "rate-logging",
                    title: "Rate limiting and logging",
                    description:
                        "Protect public endpoints and create useful operational logs.",
                    estimatedTime: "8 hours",
                },
            ],

            skills: [
                "Node.js",
                "Express.js",
                "REST APIs",
                "Socket.IO",
            ],

            checkpoint:
                "Build a layered REST API with validation, authentication, pagination, and consistent errors.",
            project:
                "Multi-user project management API",
        },

        {
            id: "stage-database",
            order: 8,
            slug: "postgresql-prisma",
            title: "PostgreSQL and Prisma",
            shortTitle: "Database",
            eyebrow: "Stage 8",

            summary:
                "Model relational data, write efficient queries, and manage schema evolution safely.",

            whyItMatters:
                "Incorrect data modelling produces duplicated information, slow queries, broken deletion, and difficult feature development.",

            estimatedTime: "4–6 weeks",
            difficulty: "INTERMEDIATE",
            kind: "DATABASE",

            topics: [
                {
                    id: "relational-model",
                    title: "Relational modelling",
                    description:
                        "Tables, rows, keys, constraints, cardinality, and relationship design.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "sql-crud",
                    title: "SQL CRUD and filtering",
                    description:
                        "Select, insert, update, delete, conditions, ordering, and aggregation.",
                    estimatedTime: "14 hours",
                    placementFocus: true,
                },
                {
                    id: "joins",
                    title: "Joins and subqueries",
                    description:
                        "Combine relational data and reason about query results.",
                    estimatedTime: "14 hours",
                    placementFocus: true,
                },
                {
                    id: "indexes-transactions",
                    title: "Indexes and transactions",
                    description:
                        "Query performance, atomic operations, consistency, and concurrency.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "normalization",
                    title: "Normalization",
                    description:
                        "Reduce duplication while balancing maintainability and query needs.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "prisma",
                    title: "Prisma ORM",
                    description:
                        "Schema models, relations, migrations, generated clients, and typed queries.",
                    estimatedTime: "14 hours",
                },
                {
                    id: "query-optimization",
                    title: "Query optimisation",
                    description:
                        "Indexes, query plans, selective fields, pagination, and avoiding N+1 patterns.",
                    estimatedTime: "10 hours",
                },
            ],

            skills: [
                "PostgreSQL",
                "SQL",
                "Prisma ORM",
            ],

            checkpoint:
                "Design and migrate the complete database for a multi-feature SaaS application.",
        },

        {
            id: "stage-auth-security",
            order: 9,
            slug: "authentication-security",
            title: "Authentication and Application Security",
            shortTitle: "Security",
            eyebrow: "Stage 9",

            summary:
                "Secure identities, sessions, permissions, user input, secrets, and sensitive application operations.",

            whyItMatters:
                "Authentication code is a trust boundary. Mistakes can expose accounts, tokens, personal data, and infrastructure credentials.",

            estimatedTime: "4 weeks",
            difficulty: "ADVANCED",
            kind: "SECURITY",

            topics: [
                {
                    id: "password-security",
                    title: "Password hashing and salting",
                    description:
                        "Use slow password hashes such as bcrypt and never store plaintext credentials.",
                    estimatedTime: "7 hours",
                    placementFocus: true,
                },
                {
                    id: "jwt-refresh",
                    title: "JWT and refresh-token architecture",
                    description:
                        "Token claims, expiry, rotation, storage, revocation, and session boundaries.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "email-oauth",
                    title: "Email verification and OAuth",
                    description:
                        "Verification tokens, expiry, Google identity, Firebase token verification, and account linking.",
                    estimatedTime: "12 hours",
                },
                {
                    id: "authorization",
                    title: "Authorization and roles",
                    description:
                        "Protect resources using ownership, roles, and explicit permission checks.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "web-attacks",
                    title: "XSS, CSRF and injection",
                    description:
                        "Understand common browser, API, and database attack paths.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "secrets-headers",
                    title: "Secrets and secure headers",
                    description:
                        "Environment isolation, HTTPS, CSP, security headers, and secret rotation.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "privacy-deletion",
                    title: "Privacy and account deletion",
                    description:
                        "Data minimisation, transparent retention, cascading deletion, and external-provider boundaries.",
                    estimatedTime: "7 hours",
                },
            ],

            skills: [
                "JWT",
                "OAuth",
                "Firebase Authentication",
                "Application Security",
            ],

            checkpoint:
                "Implement verified email/password login and Google authentication with backend token verification.",
        },

        {
            id: "stage-testing",
            order: 10,
            slug: "testing-quality",
            title: "Testing and Code Quality",
            shortTitle: "Testing",
            eyebrow: "Stage 10",

            summary:
                "Prevent regressions through automated tests, type checking, review, and repeatable quality gates.",

            whyItMatters:
                "Large applications become fragile without tests and automated checks around critical behaviour.",

            estimatedTime: "3–4 weeks",
            difficulty: "INTERMEDIATE",
            kind: "QUALITY",

            topics: [
                {
                    id: "unit-testing",
                    title: "Unit testing",
                    description:
                        "Test isolated functions, services, validation, and business rules.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "integration-testing",
                    title: "API integration testing",
                    description:
                        "Test route, middleware, service, and database behaviour together.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "component-testing",
                    title: "React component testing",
                    description:
                        "Test user interaction, loading, errors, accessibility, and rendered outcomes.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "e2e",
                    title: "End-to-end testing",
                    description:
                        "Validate critical flows such as registration, login, uploads, and deletion.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "lint-format",
                    title: "Linting, formatting and type checks",
                    description:
                        "Create repeatable static quality checks before commits and deployment.",
                    estimatedTime: "6 hours",
                },
                {
                    id: "code-review",
                    title: "Code reviews and refactoring",
                    description:
                        "Review correctness, readability, boundaries, security, and unnecessary complexity.",
                    estimatedTime: "6 hours",
                },
            ],

            skills: [
                "Unit Testing",
                "Integration Testing",
                "End-to-End Testing",
            ],

            checkpoint:
                "Protect one complete authentication or payment flow with automated tests.",
        },

        {
            id: "stage-devops",
            order: 11,
            slug: "devops-deployment",
            title: "DevOps and Deployment",
            shortTitle: "DevOps",
            eyebrow: "Stage 11",

            summary:
                "Package, deploy, observe, and troubleshoot a production web application.",

            whyItMatters:
                "A project is not placement-grade until another person can access it reliably outside your local machine.",

            estimatedTime: "4–5 weeks",
            difficulty: "ADVANCED",
            kind: "DELIVERY",

            topics: [
                {
                    id: "linux-processes",
                    title: "Linux, processes and ports",
                    description:
                        "Navigate servers, inspect processes, permissions, logs, networking, and open ports.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "git-workflow",
                    title: "Git and GitHub workflow",
                    description:
                        "Branches, commits, pull requests, conflict resolution, and repository hygiene.",
                    estimatedTime: "8 hours",
                    placementFocus: true,
                },
                {
                    id: "docker",
                    title: "Docker and Compose",
                    description:
                        "Images, containers, volumes, networking, environment configuration, and local stacks.",
                    estimatedTime: "16 hours",
                    placementFocus: true,
                },
                {
                    id: "cicd",
                    title: "CI/CD",
                    description:
                        "Run builds, tests, migrations, and deployments through automated pipelines.",
                    estimatedTime: "12 hours",
                },
                {
                    id: "hosting",
                    title: "Frontend, backend and database hosting",
                    description:
                        "Deploy static clients, APIs, managed PostgreSQL, and environment variables.",
                    estimatedTime: "12 hours",
                },
                {
                    id: "https-domain",
                    title: "Domains and HTTPS",
                    description:
                        "Configure DNS, TLS, secure origins, OAuth domains, and production callback URLs.",
                    estimatedTime: "8 hours",
                },
                {
                    id: "monitoring",
                    title: "Logging, health checks and monitoring",
                    description:
                        "Detect outages, investigate errors, and expose operational health safely.",
                    estimatedTime: "9 hours",
                },
            ],

            skills: [
                "Docker",
                "CI/CD",
                "Linux",
                "Git",
                "Deployment",
            ],

            checkpoint:
                "Deploy a containerised frontend, backend, and PostgreSQL application with HTTPS.",
        },

        {
            id: "stage-system-design",
            order: 12,
            slug: "system-design",
            title: "System Design Foundations",
            shortTitle: "System Design",
            eyebrow: "Stage 12",

            summary:
                "Reason about architecture, scale, reliability, storage, caching, and system boundaries.",

            whyItMatters:
                "System design helps you explain why your application is structured a certain way and how it would handle growth.",

            estimatedTime: "4–6 weeks",
            difficulty: "ADVANCED",
            kind: "BACKEND",

            topics: [
                {
                    id: "scalability",
                    title: "Scalability and stateless services",
                    description:
                        "Vertical and horizontal scaling, stateless APIs, and shared state.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "caching",
                    title: "Caching",
                    description:
                        "Browser, CDN, application, and database caching with invalidation trade-offs.",
                    estimatedTime: "10 hours",
                    placementFocus: true,
                },
                {
                    id: "load-balancing",
                    title: "Load balancing",
                    description:
                        "Distribute traffic, handle failures, and understand sticky sessions.",
                    estimatedTime: "7 hours",
                },
                {
                    id: "queues",
                    title: "Queues and background jobs",
                    description:
                        "Move slow or retryable work outside request-response paths.",
                    estimatedTime: "10 hours",
                },
                {
                    id: "object-storage-cdn",
                    title: "Object storage and CDN",
                    description:
                        "Store media separately and deliver it efficiently.",
                    estimatedTime: "7 hours",
                },
                {
                    id: "database-scaling",
                    title: "Database scaling",
                    description:
                        "Indexes, replicas, partitioning, connection pools, and consistency trade-offs.",
                    estimatedTime: "12 hours",
                },
                {
                    id: "reliability",
                    title: "Reliability and failure handling",
                    description:
                        "Timeouts, retries, idempotency, graceful degradation, and health checks.",
                    estimatedTime: "10 hours",
                    placementFocus: true,
                },
            ],

            skills: [
                "System Design",
                "Caching",
                "Scalability",
            ],

            checkpoint:
                "Draw and explain the architecture of PlacementOS including failure and scaling boundaries.",
        },

        {
            id: "stage-placement",
            order: 13,
            slug: "placement-readiness",
            title: "Placement and Interview Readiness",
            shortTitle: "Placement",
            eyebrow: "Stage 13",

            summary:
                "Convert technical knowledge into portfolio evidence, interview explanations, and application readiness.",

            whyItMatters:
                "Knowing technologies is not enough; recruiters need clear proof and interviewers need structured explanations.",

            estimatedTime: "Continuous",
            difficulty: "INTERMEDIATE",
            kind: "CAREER",

            topics: [
                {
                    id: "resume-projects",
                    title: "Resume project writing",
                    description:
                        "Describe problems, architecture, ownership, technologies, and measurable outcomes.",
                    estimatedTime: "6 hours",
                    placementFocus: true,
                },
                {
                    id: "github-readme",
                    title: "GitHub and README quality",
                    description:
                        "Present setup, architecture, features, screenshots, limitations, and deployment clearly.",
                    estimatedTime: "6 hours",
                    placementFocus: true,
                },
                {
                    id: "project-explanation",
                    title: "Explaining project architecture",
                    description:
                        "Explain requirements, decisions, data model, APIs, security, failures, and trade-offs.",
                    estimatedTime: "10 hours",
                    placementFocus: true,
                },
                {
                    id: "frontend-interviews",
                    title: "Frontend interview preparation",
                    description:
                        "JavaScript, TypeScript, React, browser, CSS, accessibility, and performance.",
                    estimatedTime: "20 hours",
                    placementFocus: true,
                },
                {
                    id: "backend-interviews",
                    title: "Backend interview preparation",
                    description:
                        "Node.js, Express, REST, authentication, SQL, database design, and system boundaries.",
                    estimatedTime: "20 hours",
                    placementFocus: true,
                },
                {
                    id: "behavioural",
                    title: "Behavioural and communication practice",
                    description:
                        "Use structured examples to communicate decisions, failures, collaboration, and growth.",
                    estimatedTime: "10 hours",
                },
            ],

            skills: [],
            checkpoint:
                "Deliver a ten-minute technical walkthrough of your strongest deployed project.",
        },

        {
            id: "stage-capstone",
            order: 14,
            slug: "capstone",
            title: "Placement-Grade Capstone",
            shortTitle: "Capstone",
            eyebrow: "Stage 14",

            summary:
                "Combine the roadmap into one production-quality application that demonstrates engineering judgment.",

            whyItMatters:
                "A deep, deployed capstone provides stronger evidence than multiple unfinished tutorial projects.",

            estimatedTime: "8–12 weeks",
            difficulty: "ADVANCED",
            kind: "CAREER",

            topics: [
                {
                    id: "capstone-problem",
                    title: "Choose a real problem",
                    description:
                        "Define users, pain points, scope, constraints, and measurable product outcomes.",
                    estimatedTime: "6 hours",
                },
                {
                    id: "capstone-design",
                    title: "Architecture and data design",
                    description:
                        "Plan routes, services, database relations, security, storage, and failure handling.",
                    estimatedTime: "12 hours",
                    placementFocus: true,
                },
                {
                    id: "capstone-build",
                    title: "Build in vertical slices",
                    description:
                        "Deliver complete frontend-to-database features rather than isolated layers.",
                    estimatedTime: "4–8 weeks",
                },
                {
                    id: "capstone-quality",
                    title: "Testing, accessibility and performance",
                    description:
                        "Test critical flows and audit loading, responsiveness, errors, and keyboard access.",
                    estimatedTime: "1 week",
                },
                {
                    id: "capstone-deploy",
                    title: "Deploy and monitor",
                    description:
                        "Configure production environments, migrations, domains, HTTPS, logging, and health checks.",
                    estimatedTime: "1 week",
                },
                {
                    id: "capstone-present",
                    title: "Document and present",
                    description:
                        "Create a recruiter-ready README, demo, architecture diagram, and interview story.",
                    estimatedTime: "1 week",
                    placementFocus: true,
                },
            ],

            skills: [
                "Full-Stack Development",
                "Software Architecture",
            ],

            checkpoint:
                "Deploy and present a secure, tested, documented, end-to-end product.",
            project:
                "PlacementOS or an equivalent production-grade SaaS application",
        },
    ];

const getPosition = (
    order: number
) => {
    const columns = 3;
    const row = Math.floor(order / columns);
    const positionInRow = order % columns;

    const column =
        row % 2 === 0
            ? positionInRow
            : columns - 1 - positionInRow;

    return {
        x: column * 360,
        y: row * 230,
    };
};

export const createRoadmapNodes =
    (): RoadmapFlowNode[] => {
        return fullStackRoadmapStages.map(
            (stage) => ({
                id: stage.id,
                type: "roadmapStage",
                position: getPosition(stage.order),

                data: {
                    stage,
                },

                draggable: false,
                selectable: true,
                focusable: true,

                ariaLabel:
                    `${stage.eyebrow}: ${stage.title}. ` +
                    `${stage.topics.length} topics. ` +
                    `Estimated time ${stage.estimatedTime}.`,
            })
        );
    };

export const createRoadmapEdges =
    (): RoadmapFlowEdge[] => {
        return fullStackRoadmapStages
            .slice(0, -1)
            .map((stage, index) => {
                const sourcePosition =
                    getPosition(index);

                const targetPosition =
                    getPosition(index + 1);

                const sameRow =
                    sourcePosition.y ===
                    targetPosition.y;

                const movingRight =
                    targetPosition.x >
                    sourcePosition.x;

                return {
                    id:
                        `edge-${stage.id}-` +
                        fullStackRoadmapStages[
                            index + 1
                        ].id,

                    source: stage.id,
                    target:
                        fullStackRoadmapStages[
                            index + 1
                        ].id,

                    sourceHandle: sameRow
                        ? movingRight
                            ? "right-source"
                            : "left-source"
                        : "bottom-source",

                    targetHandle: sameRow
                        ? movingRight
                            ? "left-target"
                            : "right-target"
                        : "top-target",

                    type: "smoothstep",
                    animated: false,

                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 15,
                        height: 15,
                        color: "#6366f1",
                    },

                    style: {
                        stroke: "#4f46e5",
                        strokeWidth: 2,
                    },
                };
            });
    };