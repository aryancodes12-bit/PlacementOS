interface TimedPlanItem {
    duration?: unknown;
}

interface TimedPlanCategory {
    items?: TimedPlanItem[];
}

export const parsePlanDurationToMinutes = (
    duration: unknown
): number => {
    const value = String(
        duration || ""
    )
        .trim()
        .toLowerCase();

    if (!value) {
        return 0;
    }

    const hourMatch = value.match(
        /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/
    );

    const minuteMatch = value.match(
        /(\d+)\s*(?:minutes?|mins?|min|m)\b/
    );

    const hours = hourMatch
        ? Number(hourMatch[1])
        : 0;

    const minutes = minuteMatch
        ? Number(minuteMatch[1])
        : 0;

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes)
    ) {
        return 0;
    }

    return Math.round(
        hours * 60 + minutes
    );
};

export const calculateDailyPlanMinutes = (
    categories: TimedPlanCategory[]
): number => {
    return categories.reduce(
        (
            totalMinutes,
            category
        ) => {
            if (
                !Array.isArray(
                    category.items
                )
            ) {
                return totalMinutes;
            }

            const categoryMinutes =
                category.items.reduce(
                    (
                        itemTotal,
                        item
                    ) =>
                        itemTotal +
                        parsePlanDurationToMinutes(
                            item.duration
                        ),
                    0
                );

            return (
                totalMinutes +
                categoryMinutes
            );
        },
        0
    );
};

export const formatPlanDuration = (
    totalMinutes: number
): string => {
    const safeMinutes = Math.max(
        0,
        Math.round(totalMinutes)
    );

    if (safeMinutes === 0) {
        return "0 min";
    }

    const hours = Math.floor(
        safeMinutes / 60
    );

    const minutes =
        safeMinutes % 60;

    if (hours === 0) {
        return `${minutes} min`;
    }

    const hourLabel =
        hours === 1
            ? "hour"
            : "hours";

    if (minutes === 0) {
        return `${hours} ${hourLabel}`;
    }

    return `${hours} ${hourLabel} ${minutes} min`;
};

export const calculateDailyPlanTotalTime = (
    categories: TimedPlanCategory[]
): string => {
    return formatPlanDuration(
        calculateDailyPlanMinutes(
            categories
        )
    );
};