import { createFileRoute } from "@tanstack/react-router";
import { BotIcon, Save, UserIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useSoulMemory,
  useSoulMemoryUpdate,
  useUserMemory,
  useUserMemoryUpdate,
} from "@/lib/api";

export const Route = createFileRoute("/memory/")({
  component: MemoryPage,
});

function MemorySection({
  icon,
  title,
  description,
  content,
  onContentChange,
  onSave,
  isSaving,
  isLoading,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: string;
  content: string;
  onContentChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isLoading: boolean;
}) {
  return (
    <Card className="flex w-full min-h-0 flex-col gap-2 p-4 h-1/2 md:h-full md:w-1/2">
      <CardHeader className="gap-2 px-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button
            size="sm"
            variant="outline"
            onClick={onSave}
            disabled={isSaving || isLoading}
          >
            <Save className="size-4" />
            Save
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 min-h-0 flex-col gap-2 px-0">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-md" />
        ) : (
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Write your memory here..."
            className="min-h-0 flex-1 resize-none font-mono text-sm"
          />
        )}
      </CardContent>
    </Card>
  );
}

function MemoryPage() {
  const { data: userData, isLoading: userLoading } = useUserMemory();
  const { data: soulData, isLoading: soulLoading } = useSoulMemory();
  const userUpdate = useUserMemoryUpdate();
  const soulUpdate = useSoulMemoryUpdate();

  const [userDraft, setUserDraft] = useState<string | undefined>(undefined);
  const [soulDraft, setSoulDraft] = useState<string | undefined>(undefined);

  const userContent =
    userDraft !== undefined ? userDraft : (userData?.content ?? "");
  const soulContent =
    soulDraft !== undefined ? soulDraft : (soulData?.content ?? "");

  const handleUserChange = (value: string) => setUserDraft(value);
  const handleSoulChange = (value: string) => setSoulDraft(value);

  const handleUserSave = () => {
    userUpdate.mutate(userContent, {
      onSuccess: () => {
        setUserDraft(undefined);
        toast.success("USER.md saved");
      },
      onError: () => toast.error("Failed to save USER.md"),
    });
  };

  const handleSoulSave = () => {
    soulUpdate.mutate(soulContent, {
      onSuccess: () => {
        setSoulDraft(undefined);
        toast.success("SOUL.md saved");
      },
      onError: () => toast.error("Failed to save SOUL.md"),
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6 md:flex-row">
      <div className="flex h-full min-h-0 flex-col gap-4 md:flex-row container mx-auto">
        <MemorySection
          icon={<UserIcon className="size-4" />}
          title="Memory of the User"
          description="User preferences, context, and important history. Loaded into every session."
          content={userContent}
          onContentChange={handleUserChange}
          onSave={handleUserSave}
          isSaving={userUpdate.isPending}
          isLoading={userLoading}
        />
        <MemorySection
          icon={<BotIcon className="size-4" />}
          title="Memory of the Agent's Soul"
          description="Agent identity, principles, and capabilities. Defines who the assistant is."
          content={soulContent}
          onContentChange={handleSoulChange}
          onSave={handleSoulSave}
          isSaving={soulUpdate.isPending}
          isLoading={soulLoading}
        />
      </div>
    </div>
  );
}
