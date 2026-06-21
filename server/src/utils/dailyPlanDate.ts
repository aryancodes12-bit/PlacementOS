const DAILY_PLAN_TIME_ZONE =
    process.env.APP_TIME_ZONE ||
    "Asia/Kolkata";

const dailyPlanDateFormatter =
    new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone:
                DAILY_PLAN_TIME_ZONE,

            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    );

export const getDailyPlanDateKey = (
    date = new Date()
): string => {
    const parts =
        dailyPlanDateFormatter
            .formatToParts(date);

    const getPart = (
        type:
            | "year"
            | "month"
            | "day"
    ) => {
        return (
            parts.find(
                (part) =>
                    part.type === type
            )?.value || ""
        );
    };

    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");

    if (!year || !month || !day) {
        throw new Error(
            "Failed to generate daily-plan date key."
        );
    }

    return `${year}-${month}-${day}`;
};