import axios from "axios";
import { prisma } from "../prisma/client";
import { getNextRevisionDate, refreshDSAReadiness } from "./dsa.service";

const LEETCODE_GRAPHQL_URL =
    "https://leetcode.com/graphql/";

const DEFAULT_PREVIEW_LIMIT = 10;
const MAX_PREVIEW_LIMIT = 20;

type DSADifficulty =
    | "EASY"
    | "MEDIUM"
    | "HARD";

interface GraphQLError {
    message: string;
}

interface GraphQLResponse<T> {
    data?: T;
    errors?: GraphQLError[];
}

interface RawLeetCodeSubmission {
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
}

interface RawLeetCodeStats {
    difficulty: string;
    count: number;
}

interface RawPreviewResponse {
    matchedUser: {
        username: string;
        submitStats: {
            acSubmissionNum: RawLeetCodeStats[];
        };
    } | null;

    recentAcSubmissionList:
    | RawLeetCodeSubmission[]
    | null;
}

interface RawQuestionMetadata {
    questionId?: string | null;
    questionFrontendId?: string | null;
    title: string;
    titleSlug: string;
    difficulty: string;

    topicTags: Array<{
        name: string;
        slug: string;
    }>;
}

interface QuestionMetadataResponse {
    [alias: string]:
    | RawQuestionMetadata
    | null;
}

export class LeetCodeServiceError extends Error {
    statusCode: number;
    code: string;

    constructor(
        statusCode: number,
        code: string,
        message: string
    ) {
        super(message);

        this.name = "LeetCodeServiceError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

const PREVIEW_QUERY = `
  query getPlacementOSLeetCodePreview(
    $username: String!
    $limit: Int!
  ) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }

    recentAcSubmissionList(
      username: $username
      limit: $limit
    ) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

const normalizeUsername = (
    username: string
) => {
    return username.trim();
};

const validateUsername = (
    username: string
) => {
    if (!username) {
        throw new LeetCodeServiceError(
            400,
            "USERNAME_REQUIRED",
            "LeetCode username is required."
        );
    }

    if (
        username.length > 50 ||
        !/^[a-zA-Z0-9_-]+$/.test(username)
    ) {
        throw new LeetCodeServiceError(
            400,
            "INVALID_USERNAME",
            "Enter a valid LeetCode username."
        );
    }
};

const normalizeLimit = (
    limit?: number
) => {
    if (!Number.isFinite(limit)) {
        return DEFAULT_PREVIEW_LIMIT;
    }

    return Math.max(
        1,
        Math.min(
            MAX_PREVIEW_LIMIT,
            Math.floor(limit!)
        )
    );
};

const executeGraphQL = async <T>(
    query: string,
    variables: Record<string, unknown>
): Promise<T> => {
    try {
        const response =
            await axios.post<GraphQLResponse<T>>(
                LEETCODE_GRAPHQL_URL,
                {
                    query,
                    variables,
                },
                {
                    timeout: 12_000,

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        "User-Agent":
                            "PlacementOS/1.0",

                        Referer:
                            "https://leetcode.com/",
                    },
                }
            );

        if (
            response.data.errors &&
            response.data.errors.length > 0
        ) {
            throw new LeetCodeServiceError(
                502,
                "LEETCODE_GRAPHQL_ERROR",
                response.data.errors
                    .map((error) => error.message)
                    .join("; ")
            );
        }

        if (!response.data.data) {
            throw new LeetCodeServiceError(
                502,
                "INVALID_LEETCODE_RESPONSE",
                "LeetCode returned an invalid response."
            );
        }

        return response.data.data;
    } catch (error) {
        if (
            error instanceof
            LeetCodeServiceError
        ) {
            throw error;
        }

        if (axios.isAxiosError(error)) {
            if (error.code === "ECONNABORTED") {
                throw new LeetCodeServiceError(
                    504,
                    "LEETCODE_TIMEOUT",
                    "LeetCode took too long to respond. Try again shortly."
                );
            }

            const status =
                error.response?.status;

            if (status === 429) {
                throw new LeetCodeServiceError(
                    503,
                    "LEETCODE_RATE_LIMITED",
                    "LeetCode temporarily rate-limited the request."
                );
            }

            if (
                status === 401 ||
                status === 403
            ) {
                throw new LeetCodeServiceError(
                    503,
                    "LEETCODE_BLOCKED_REQUEST",
                    "LeetCode temporarily blocked the preview request."
                );
            }

            throw new LeetCodeServiceError(
                503,
                "LEETCODE_UNAVAILABLE",
                "LeetCode preview is temporarily unavailable."
            );
        }

        throw error;
    }
};

const getUniqueSubmissions = (
    submissions: RawLeetCodeSubmission[]
) => {
    const seenSlugs = new Set<string>();

    return submissions.filter(
        (submission) => {
            const slug =
                submission.titleSlug?.trim();

            if (
                !slug ||
                seenSlugs.has(slug)
            ) {
                return false;
            }

            seenSlugs.add(slug);

            return true;
        }
    );
};

const fetchQuestionMetadata = async (
    titleSlugs: string[]
) => {
    if (titleSlugs.length === 0) {
        return new Map<
            string,
            RawQuestionMetadata
        >();
    }

    const variableDefinitions =
        titleSlugs
            .map(
                (_, index) =>
                    `$slug${index}: String!`
            )
            .join(", ");

    const questionFields =
        titleSlugs
            .map(
                (_, index) => `
          question${index}: question(
            titleSlug: $slug${index}
          ) {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            topicTags {
              name
              slug
            }
          }
        `
            )
            .join("\n");

    const query = `
    query getPlacementOSQuestionMetadata(
      ${variableDefinitions}
    ) {
      ${questionFields}
    }
  `;

    const variables =
        titleSlugs.reduce<
            Record<string, string>
        >(
            (result, slug, index) => {
                result[`slug${index}`] = slug;
                return result;
            },
            {}
        );

    try {
        const response =
            await executeGraphQL<QuestionMetadataResponse>(
                query,
                variables
            );

        const metadataMap = new Map<
            string,
            RawQuestionMetadata
        >();

        titleSlugs.forEach(
            (slug, index) => {
                const metadata =
                    response[`question${index}`];

                if (metadata) {
                    metadataMap.set(
                        slug,
                        metadata
                    );
                }
            }
        );

        return metadataMap;
    } catch (error) {
        /*
         * Metadata enrichment is optional.
         * Recent accepted submissions can still be
         * previewed even if question details fail.
         */
        console.warn(
            "LeetCode question metadata enrichment failed:",
            error
        );

        return new Map<
            string,
            RawQuestionMetadata
        >();
    }
};

const mapDifficulty = (
    difficulty?: string | null
): DSADifficulty | null => {
    switch (
    difficulty?.trim().toUpperCase()
    ) {
        case "EASY":
            return "EASY";

        case "MEDIUM":
            return "MEDIUM";

        case "HARD":
            return "HARD";

        default:
            return null;
    }
};

const inferTopic = (
    tags: RawQuestionMetadata["topicTags"]
) => {
    const slugs = new Set(
        tags.map((tag) =>
            tag.slug.toLowerCase()
        )
    );

    const rules: Array<{
        tags: string[];
        topic: string;
    }> = [
            {
                tags: ["array"],
                topic: "Arrays",
            },
            {
                tags: ["string"],
                topic: "Strings",
            },
            {
                tags: ["linked-list"],
                topic: "Linked List",
            },
            {
                tags: ["stack"],
                topic: "Stack",
            },
            {
                tags: ["queue"],
                topic: "Queue",
            },
            {
                tags: [
                    "tree",
                    "binary-tree",
                    "binary-search-tree",
                ],
                topic: "Trees",
            },
            {
                tags: [
                    "graph",
                    "graph-theory",
                    "breadth-first-search",
                    "depth-first-search",
                ],
                topic: "Graphs",
            },
            {
                tags: [
                    "dynamic-programming",
                ],
                topic:
                    "Dynamic Programming",
            },
            {
                tags: ["binary-search"],
                topic: "Binary Search",
            },
            {
                tags: ["sorting"],
                topic: "Sorting",
            },
            {
                tags: [
                    "hash-table",
                    "hash-function",
                ],
                topic: "Hashing",
            },
            {
                tags: ["greedy"],
                topic: "Greedy",
            },
            {
                tags: ["backtracking"],
                topic: "Backtracking",
            },
            {
                tags: [
                    "heap-priority-queue",
                ],
                topic: "Heap",
            },
            {
                tags: ["trie"],
                topic: "Trie",
            },
            {
                tags: [
                    "math",
                    "number-theory",
                ],
                topic: "Math",
            },
        ];

    const match = rules.find((rule) =>
        rule.tags.some((tag) =>
            slugs.has(tag)
        )
    );

    return match?.topic || "General";
};

const inferPattern = (
    tags: RawQuestionMetadata["topicTags"]
) => {
    const slugs = new Set(
        tags.map((tag) =>
            tag.slug.toLowerCase()
        )
    );

    const rules: Array<{
        tags: string[];
        pattern: string;
    }> = [
            {
                tags: ["hash-table"],
                pattern: "HashMap",
            },
            {
                tags: ["two-pointers"],
                pattern: "Two Pointers",
            },
            {
                tags: ["sliding-window"],
                pattern: "Sliding Window",
            },
            {
                tags: ["binary-search"],
                pattern: "Binary Search",
            },
            {
                tags: ["prefix-sum"],
                pattern: "Prefix Sum",
            },
            {
                tags: ["stack"],
                pattern: "Stack",
            },
            {
                tags: ["queue"],
                pattern: "Queue",
            },
            {
                tags: ["linked-list"],
                pattern: "Linked List",
            },
            {
                tags: [
                    "tree",
                    "binary-tree",
                    "binary-search-tree",
                ],
                pattern: "Trees",
            },
            {
                tags: [
                    "graph",
                    "graph-theory",
                    "breadth-first-search",
                    "depth-first-search",
                ],
                pattern: "Graphs",
            },
            {
                tags: [
                    "dynamic-programming",
                ],
                pattern:
                    "Dynamic Programming",
            },
            {
                tags: ["backtracking"],
                pattern: "Backtracking",
            },
        ];

    return (
        rules.find((rule) =>
            rule.tags.some((tag) =>
                slugs.has(tag)
            )
        )?.pattern || null
    );
};

const timestampToIso = (
    timestamp: string
) => {
    const timestampNumber =
        Number(timestamp);

    if (
        !Number.isFinite(timestampNumber)
    ) {
        return null;
    }

    return new Date(
        timestampNumber * 1000
    ).toISOString();
};

const buildSolvedStats = (
    stats: RawLeetCodeStats[]
) => {
    const getCount = (
        difficulty: string
    ) => {
        return (
            stats.find(
                (item) =>
                    item.difficulty.toLowerCase() ===
                    difficulty.toLowerCase()
            )?.count ?? 0
        );
    };

    return {
        total: getCount("All"),
        easy: getCount("Easy"),
        medium: getCount("Medium"),
        hard: getCount("Hard"),
    };
};

export const getLeetCodePreview =
    async (
        userId: string,
        usernameInput: string,
        requestedLimit?: number
    ) => {
        const username =
            normalizeUsername(usernameInput);

        validateUsername(username);

        const limit =
            normalizeLimit(requestedLimit);

        const previewResponse =
            await executeGraphQL<RawPreviewResponse>(
                PREVIEW_QUERY,
                {
                    username,
                    limit,
                }
            );

        if (
            !previewResponse.matchedUser
        ) {
            throw new LeetCodeServiceError(
                404,
                "LEETCODE_USER_NOT_FOUND",
                "No public LeetCode profile was found for this username."
            );
        }

        const uniqueSubmissions =
            getUniqueSubmissions(
                previewResponse
                    .recentAcSubmissionList ?? []
            );

        const titleSlugs =
            uniqueSubmissions.map(
                (submission) =>
                    submission.titleSlug
            );

        const [
            metadataMap,
            existingProblems,
        ] = await Promise.all([
            fetchQuestionMetadata(
                titleSlugs
            ),

            titleSlugs.length > 0
                ? prisma.dSAProblem.findMany({
                    where: {
                        userId,
                        source: "LEETCODE",
                        externalId: {
                            in: titleSlugs,
                        },
                    },
                    select: {
                        externalId: true,
                    },
                })
                : Promise.resolve([]),
        ]);

        const importedSlugs = new Set(
            existingProblems
                .map(
                    (problem) =>
                        problem.externalId
                )
                .filter(
                    (
                        externalId
                    ): externalId is string =>
                        Boolean(externalId)
                )
        );

        const submissions =
            uniqueSubmissions.map(
                (submission) => {
                    const metadata =
                        metadataMap.get(
                            submission.titleSlug
                        );

                    const tags =
                        metadata?.topicTags ?? [];

                    return {
                        externalId:
                            submission.titleSlug,

                        submissionId:
                            submission.id,

                        title:
                            metadata?.title ||
                            submission.title,

                        titleSlug:
                            submission.titleSlug,

                        problemUrl:
                            `https://leetcode.com/problems/${submission.titleSlug}/`,

                        difficulty:
                            mapDifficulty(
                                metadata?.difficulty
                            ),

                        suggestedTopic:
                            metadata
                                ? inferTopic(tags)
                                : "General",

                        suggestedPattern:
                            metadata
                                ? inferPattern(tags)
                                : null,

                        tags: tags.map(
                            (tag) => tag.name
                        ),

                        acceptedAt:
                            timestampToIso(
                                submission.timestamp
                            ),

                        alreadyImported:
                            importedSlugs.has(
                                submission.titleSlug
                            ),

                        metadataAvailable:
                            Boolean(metadata),
                    };
                }
            );

        return {
            username:
                previewResponse
                    .matchedUser.username,

            solvedStats:
                buildSolvedStats(
                    previewResponse
                        .matchedUser
                        .submitStats
                        ?.acSubmissionNum ?? []
                ),

            submissions,

            previewLimit: limit,

            importableCount:
                submissions.filter(
                    (submission) =>
                        !submission.alreadyImported
                ).length,

            integration: {
                provider: "LeetCode",
                mode: "best-effort-preview",
            },
        };
    };
export interface LeetCodeImportItem {
    externalId: string;
    topic?: string;
    pattern?: string | null;
    difficulty?: DSADifficulty;
    companies?: string[];
    notes?: string;
}

interface NormalizedLeetCodeImportItem {
    externalId: string;
    topic?: string;
    pattern?: string | null;
    difficulty?: DSADifficulty;
    companies: string[];
    notes?: string;
}

const MAX_IMPORT_ITEMS = 20;

const normalizeComparableText = (value: string) => {
    return value.trim().toLowerCase();
};

const normalizeProblemUrl = (value?: string | null) => {
    if (!value) return "";

    return value
        .trim()
        .toLowerCase()
        .replace(/\/+$/, "");
};

const normalizeOptionalText = (
    value: unknown,
    maximumLength: number
) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    const normalized = String(value).trim();

    if (!normalized) {
        return undefined;
    }

    return normalized.slice(0, maximumLength);
};

const normalizeCompanies = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return Array.from(
        new Set(
            value
                .map((company) => String(company).trim())
                .filter(Boolean)
                .map((company) => company.slice(0, 80))
        )
    ).slice(0, 20);
};

const validateDifficulty = (
    value: unknown
): DSADifficulty | undefined => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    const normalized = String(value).trim().toUpperCase();

    if (
        normalized !== "EASY" &&
        normalized !== "MEDIUM" &&
        normalized !== "HARD"
    ) {
        throw new LeetCodeServiceError(
            400,
            "INVALID_DIFFICULTY",
            "Difficulty must be EASY, MEDIUM, or HARD."
        );
    }

    return normalized;
};

const normalizeImportItems = (
    itemsInput: unknown
): NormalizedLeetCodeImportItem[] => {
    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
        throw new LeetCodeServiceError(
            400,
            "IMPORT_ITEMS_REQUIRED",
            "Select at least one LeetCode problem to import."
        );
    }

    if (itemsInput.length > MAX_IMPORT_ITEMS) {
        throw new LeetCodeServiceError(
            400,
            "IMPORT_LIMIT_EXCEEDED",
            `A maximum of ${MAX_IMPORT_ITEMS} problems can be imported at once.`
        );
    }

    const seenExternalIds = new Set<string>();

    return itemsInput.map((rawItem, index) => {
        if (
            typeof rawItem !== "object" ||
            rawItem === null ||
            Array.isArray(rawItem)
        ) {
            throw new LeetCodeServiceError(
                400,
                "INVALID_IMPORT_ITEM",
                `Import item ${index + 1} is invalid.`
            );
        }

        const item = rawItem as Record<string, unknown>;

        const externalId = String(
            item.externalId ?? ""
        )
            .trim()
            .toLowerCase();

        if (!externalId || !/^[a-z0-9-]+$/.test(externalId)) {
            throw new LeetCodeServiceError(
                400,
                "INVALID_EXTERNAL_ID",
                `Import item ${index + 1} has an invalid externalId.`
            );
        }

        if (seenExternalIds.has(externalId)) {
            throw new LeetCodeServiceError(
                400,
                "DUPLICATE_IMPORT_SELECTION",
                `The problem '${externalId}' was selected more than once.`
            );
        }

        seenExternalIds.add(externalId);

        return {
            externalId,

            topic: normalizeOptionalText(
                item.topic,
                100
            ),

            pattern:
                item.pattern === null
                    ? null
                    : normalizeOptionalText(
                        item.pattern,
                        100
                    ),

            difficulty: validateDifficulty(
                item.difficulty
            ),

            companies: normalizeCompanies(
                item.companies
            ),

            notes: normalizeOptionalText(
                item.notes,
                2000
            ),
        };
    });
};

const acceptedAtToDate = (
    value?: string | null
) => {
    if (!value) {
        return new Date();
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return new Date();
    }

    return parsed;
};

export const importLeetCodeProblems = async (
    userId: string,
    usernameInput: string,
    itemsInput: unknown
) => {
    const username = normalizeUsername(usernameInput);

    validateUsername(username);

    const selectedItems =
        normalizeImportItems(itemsInput);

    /*
     * Refetch preview server-side.
     * This prevents a client from submitting arbitrary
     * problem titles, URLs, solved dates, or external IDs.
     */
    const preview = await getLeetCodePreview(
        userId,
        username,
        MAX_IMPORT_ITEMS
    );

    const previewByExternalId = new Map(
        preview.submissions.map((submission) => [
            submission.externalId,
            submission,
        ])
    );

    const unavailableSelections =
        selectedItems.filter(
            (item) =>
                !previewByExternalId.has(item.externalId)
        );

    if (unavailableSelections.length > 0) {
        throw new LeetCodeServiceError(
            400,
            "INVALID_IMPORT_SELECTION",
            `These selected problems are not available in the current preview: ${unavailableSelections
                .map((item) => item.externalId)
                .join(", ")}. Refresh the preview and try again.`
        );
    }

    /*
     * Fetch all tracked problems for robust duplicate
     * detection across both MANUAL and LEETCODE sources.
     */
    const existingProblems =
        await prisma.dSAProblem.findMany({
            where: {
                userId,
            },
            select: {
                id: true,
                title: true,
                source: true,
                externalId: true,
                problemUrl: true,
            },
        });

    const existingExternalIds = new Set(
        existingProblems
            .map((problem) => problem.externalId)
            .filter(
                (externalId): externalId is string =>
                    Boolean(externalId)
            )
            .map(normalizeComparableText)
    );

    const existingTitles = new Set(
        existingProblems.map((problem) =>
            normalizeComparableText(problem.title)
        )
    );

    const existingUrls = new Set(
        existingProblems
            .map((problem) =>
                normalizeProblemUrl(problem.problemUrl)
            )
            .filter(Boolean)
    );

    const skipped: Array<{
        externalId: string;
        title: string;
        reason:
        | "ALREADY_IMPORTED"
        | "ALREADY_TRACKED"
        | "DIFFICULTY_UNAVAILABLE";
    }> = [];

    const importCandidates: Array<{
        externalId: string;
        title: string;
        topic: string;
        pattern: string | null;
        difficulty: DSADifficulty;
        problemUrl: string;
        companies: string[];
        notes: string | null;
        solvedAt: Date;
    }> = [];

    for (const selection of selectedItems) {
        const previewProblem =
            previewByExternalId.get(selection.externalId)!;

        const normalizedTitle =
            normalizeComparableText(previewProblem.title);

        const normalizedUrl =
            normalizeProblemUrl(previewProblem.problemUrl);

        if (
            previewProblem.alreadyImported ||
            existingExternalIds.has(
                selection.externalId
            )
        ) {
            skipped.push({
                externalId: selection.externalId,
                title: previewProblem.title,
                reason: "ALREADY_IMPORTED",
            });

            continue;
        }

        /*
         * Prevent importing a LeetCode problem already
         * tracked manually under the same title or URL.
         */
        if (
            existingTitles.has(normalizedTitle) ||
            existingUrls.has(normalizedUrl)
        ) {
            skipped.push({
                externalId: selection.externalId,
                title: previewProblem.title,
                reason: "ALREADY_TRACKED",
            });

            continue;
        }

        const difficulty =
            selection.difficulty ??
            previewProblem.difficulty;

        if (!difficulty) {
            skipped.push({
                externalId: selection.externalId,
                title: previewProblem.title,
                reason: "DIFFICULTY_UNAVAILABLE",
            });

            continue;
        }

        importCandidates.push({
            externalId: selection.externalId,

            title: previewProblem.title,

            topic:
                selection.topic ||
                previewProblem.suggestedTopic ||
                "General",

            pattern:
                selection.pattern !== undefined
                    ? selection.pattern
                    : previewProblem.suggestedPattern,

            difficulty,

            problemUrl:
                previewProblem.problemUrl,

            companies:
                selection.companies,

            notes:
                selection.notes ?? null,

            solvedAt:
                acceptedAtToDate(
                    previewProblem.acceptedAt
                ),
        });

        /*
         * Prevent duplicate candidates inside this same
         * import after normalization.
         */
        existingExternalIds.add(
            selection.externalId
        );

        existingTitles.add(
            normalizedTitle
        );

        existingUrls.add(
            normalizedUrl
        );
    }

    const importedAt = new Date();

    /*
     * First revision begins from import time, not the old
     * LeetCode accepted date. Otherwise historical imports
     * would become immediately overdue.
     */
    const nextRevisionAt =
        getNextRevisionDate(0, importedAt);

    const imported =
        importCandidates.length > 0
            ? await prisma.$transaction(
                importCandidates.map((candidate) =>
                    prisma.dSAProblem.create({
                        data: {
                            userId,

                            title: candidate.title,
                            topic: candidate.topic,
                            pattern: candidate.pattern,
                            difficulty: candidate.difficulty,
                            status: "SOLVED",

                            platform: "LeetCode",
                            problemUrl: candidate.problemUrl,

                            source: "LEETCODE",
                            externalId: candidate.externalId,
                            importedAt,

                            companies: candidate.companies,
                            notes: candidate.notes,

                            solveCount: 1,
                            solvedAt: candidate.solvedAt,

                            revisionCount: 0,
                            lastRevisedAt: null,
                            nextRevisionAt,
                        },
                    })
                )
            )
            : [];

    let readiness = null;

    if (imported.length > 0) {
        readiness =
            await refreshDSAReadiness(userId);
    }

    return {
        username: preview.username,

        imported,

        skipped,

        summary: {
            requested: selectedItems.length,
            imported: imported.length,
            skipped: skipped.length,
        },

        readiness: readiness
            ? {
                dsaScore: readiness.dsaScore,
                overallScore:
                    readiness.readiness.overallScore,
            }
            : null,
    };
};