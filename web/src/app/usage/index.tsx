import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useClaudeUsage,
  useCodexUsage,
  useCurrentUsageRunner,
} from "@/lib/api";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

export const Route = createFileRoute("/usage/")({
  component: UsagePage,
});

function formatResetsIn(resetsAt: string): string {
  const target = dayjs(resetsAt);
  const now = dayjs();
  const diffMs = target.diff(now);
  if (diffMs <= 0) return "Resets soon";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `Resets in ${hours} hr ${minutes} min`;
  }
  return `Resets in ${minutes} min`;
}

function formatResetsAt(resetsAt: string): string {
  const target = dayjs(resetsAt);
  return `Resets ${target.format("ddd h:mm A")}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function UsagePage() {
  const {
    data: currentRunner,
    isLoading: isRunnerLoading,
  } = useCurrentUsageRunner();
  const isClaudeRunner = currentRunner?.runner_type === "claude";
  const isCodexRunner = currentRunner?.runner_type === "codex";
  const {
    data: claudeUsage,
    isLoading,
    isRefetching,
    refetch,
    dataUpdatedAt,
  } = useClaudeUsage({ enabled: isClaudeRunner });
  const {
    data: codexUsage,
    isLoading: isCodexLoading,
    isRefetching: isCodexRefetching,
    refetch: refetchCodex,
    dataUpdatedAt: codexUpdatedAt,
  } = useCodexUsage({ enabled: isCodexRunner });

  const lastUpdatedLabel =
    dataUpdatedAt != null
      ? `Last updated: ${dayjs(dataUpdatedAt).fromNow()}`
      : "Last updated: --";
  const codexLastUpdatedLabel =
    codexUsage?.last_updated_at != null
      ? `Last updated: ${dayjs(codexUsage.last_updated_at).fromNow()}`
      : codexUpdatedAt != null
        ? `Last updated: ${dayjs(codexUpdatedAt).fromNow()}`
        : "Last updated: --";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="container-md mx-auto flex max-w-2xl flex-col gap-6">
        {isRunnerLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : null}

        {isClaudeRunner ? (
          <Card>
            <CardHeader>
              <CardTitle>Claude usage limits</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Current session</h3>
                {isLoading ? (
                  <Skeleton className="h-2 w-full" />
                ) : claudeUsage?.five_hour ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {claudeUsage.five_hour.resets_at
                        ? formatResetsIn(claudeUsage.five_hour.resets_at)
                        : "Starts when a message is sent"}
                    </p>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={Math.min(claudeUsage.five_hour.utilization, 100)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">
                        {claudeUsage.five_hour.utilization}% used
                      </span>
                    </div>
                  </>
                ) : null}
              </div>

              <Separator />

              <section className="flex flex-col gap-4">
                <h3 className="text-sm font-medium">Weekly limits</h3>
                <a
                  href="https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Learn more about usage limits
                </a>

                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">All models</h3>
                  {isLoading ? (
                    <Skeleton className="h-2 w-full" />
                  ) : claudeUsage?.seven_day ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {formatResetsAt(claudeUsage.seven_day.resets_at)}
                      </p>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={Math.min(
                            claudeUsage.seven_day.utilization,
                            100,
                          )}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">
                          {claudeUsage.seven_day.utilization}% used
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{lastUpdatedLabel}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    aria-label="Refresh"
                  >
                    <RefreshCw
                      className={cn("size-3.5", isRefetching && "animate-spin")}
                    />
                  </Button>
                </div>
              </section>

              <Separator />

              <section className="flex flex-col gap-4">
                <h3 className="text-sm font-medium">Extra usage</h3>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Turn on extra usage to keep using Claude if you hit a
                    limit.{" "}
                    <a
                      href="https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:underline"
                    >
                      Learn more
                    </a>
                  </p>
                  {isLoading ? (
                    <Skeleton className="size-8 w-14 shrink-0 rounded-full" />
                  ) : (
                    <Switch
                      checked={claudeUsage?.extra_usage?.is_enabled ?? false}
                      disabled
                      aria-label="Extra usage"
                    />
                  )}
                </div>
              </section>
            </CardContent>
          </Card>
        ) : null}

        {isCodexRunner ? (
          <Card>
            <CardHeader>
              <CardTitle>Codex token usage</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Lifetime</h3>
                  {isCodexLoading ? (
                    <Skeleton className="h-18 w-full" />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <UsageMetricCard
                        label="Input"
                        value={formatNumber(
                          codexUsage?.lifetime.input_tokens ?? 0,
                        )}
                      />
                      <UsageMetricCard
                        label="Cached input"
                        value={formatNumber(
                          codexUsage?.lifetime.cached_input_tokens ?? 0,
                        )}
                      />
                      <UsageMetricCard
                        label="Output"
                        value={formatNumber(
                          codexUsage?.lifetime.output_tokens ?? 0,
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Recent 7 days</h3>
                  {isCodexLoading ? (
                    <Skeleton className="h-18 w-full" />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <UsageMetricCard
                        label="Input"
                        value={formatNumber(
                          codexUsage?.recent_7d.input_tokens ?? 0,
                        )}
                      />
                      <UsageMetricCard
                        label="Cached input"
                        value={formatNumber(
                          codexUsage?.recent_7d.cached_input_tokens ?? 0,
                        )}
                      />
                      <UsageMetricCard
                        label="Output"
                        value={formatNumber(
                          codexUsage?.recent_7d.output_tokens ?? 0,
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{codexLastUpdatedLabel}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => refetchCodex()}
                    disabled={isCodexRefetching}
                    aria-label="Refresh Codex usage"
                  >
                    <RefreshCw
                      className={cn(
                        "size-3.5",
                        isCodexRefetching && "animate-spin",
                      )}
                    />
                  </Button>
                </div>
              </section>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function UsageMetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
