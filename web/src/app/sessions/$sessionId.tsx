import { createFileRoute } from "@tanstack/react-router";
import type {
  AssistantMessage,
  BashToolUseMessageContent,
  EditToolUseMessageContent,
  GlobToolUseMessageContent,
  GrepToolUseMessageContent,
  ReadToolUseMessageContent,
  SkillToolUseMessageContent,
  ToolMessage,
  UserMessage,
  WebFetchToolUseMessageContent,
  WebSearchToolUseMessageContent,
  WriteToolUseMessageContent,
} from "agentara";
import {
  BotIcon,
  FileSearchIcon,
  FileTextIcon,
  GlobeIcon,
  PencilIcon,
  PenLineIcon,
  SearchIcon,
  SparkleIcon,
  TerminalIcon,
} from "lucide-react";
import { Fragment } from "react";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionHistory } from "@/lib/api";

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetailPage,
});

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const { data, isLoading } = useSessionHistory(sessionId);

  return (
    <div className="flex flex-1 flex-col size-full">
      <div className="flex min-h-0 size-full flex-1 flex-col mx-auto">
        {isLoading ? (
          <div className="flex flex-1 flex-col gap-8 p-4">
            <Skeleton className="h-16 w-3/4 max-w-md self-end" />
            <Skeleton className="h-20 w-2/3 max-w-lg" />
            <Skeleton className="h-12 w-1/2 max-w-sm self-end" />
          </div>
        ) : (
          <Conversation className="min-h-0 flex-1 size-full">
            {!data?.groups?.length ? (
              <ConversationEmptyState
                title="No messages yet"
                description="Start a conversation to see messages here"
              />
            ) : (
              <ConversationContent className="gap-12 size-full container-sm mx-auto">
                {data.groups.map((group) => (
                  <Fragment key={group.inbound.id}>
                    <div>
                      {(() => {
                        const inboundText = group.inbound.role;
                        return inboundText ? (
                          <Message from="user">
                            <MessageContent>
                              {renderContent(group.inbound)}
                            </MessageContent>
                          </Message>
                        ) : null;
                      })()}
                    </div>
                    <div>
                      {group.steps.length > 0 && (
                        <ChainOfThought className="mb-4 border rounded-md p-0">
                          <ChainOfThoughtHeader className="pt-2 pl-3 pr-2" />
                          <ChainOfThoughtContent className="pl-3 pb-4 pt-1">
                            {group.steps.map((step) => renderStep(step))}
                          </ChainOfThoughtContent>
                        </ChainOfThought>
                      )}
                      {group.outbound &&
                        (() => {
                          const text = group.outbound.role;
                          return text ? (
                            <Message from="assistant">
                              <MessageContent>
                                {renderContent(group.outbound)}
                              </MessageContent>
                            </Message>
                          ) : null;
                        })()}
                    </div>
                  </Fragment>
                ))}
                <div className="pb-12"></div>
              </ConversationContent>
            )}
            <ConversationScrollButton />
          </Conversation>
        )}
      </div>
    </div>
  );
}

function renderContent(message: UserMessage | AssistantMessage) {
  return message.content.map((content) => {
    if (content.type === "text") {
      return <MessageResponse>{content.text}</MessageResponse>;
    }
  });
}

function renderStep(step: AssistantMessage | ToolMessage) {
  return step.content.map((content) => {
    if (content.type === "text") {
      return (
        <ChainOfThoughtStep
          key={step.id}
          label={<MessageResponse>{content.text}</MessageResponse>}
        />
      );
    } else if (content.type === "thinking") {
      return (
        <ChainOfThoughtStep
          key={step.id}
          label={<MessageResponse>{content.thinking}</MessageResponse>}
        />
      );
    } else if (content.type === "tool_use") {
      switch (content.name) {
        case "Agent":
        case "Task": {
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={BotIcon}
              label="Run sub-agent"
            />
          );
        }
        case "Bash": {
          const bashContent = content as BashToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={TerminalIcon}
              label={bashContent.input.description ?? bashContent.input.command}
            />
          );
        }
        case "Edit": {
          const editContent = content as EditToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={PencilIcon}
              label={`Edit "${editContent.input.file_path}"`}
            />
          );
        }
        case "Glob": {
          const globContent = content as GlobToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={FileSearchIcon}
              label={`Search files by pattern "${globContent.input.pattern}"`}
            />
          );
        }
        case "Grep": {
          const grepContent = content as GrepToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={FileSearchIcon}
              label={`Search text by pattern "${grepContent.input.pattern}" in "${grepContent.input.glob}"`}
            />
          );
        }
        case "WebFetch": {
          const webFetchContent = content as WebFetchToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={GlobeIcon}
              label={`Fetch web page from "${webFetchContent.input.url}"`}
            />
          );
        }
        case "WebSearch": {
          const webSearchContent = content as WebSearchToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={SearchIcon}
              label={`Search web for "${webSearchContent.input.query}"`}
            />
          );
        }
        case "Read": {
          const readContent = content as ReadToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={FileTextIcon}
              label={`Read file "${readContent.input.file_path}"`}
            />
          );
        }
        case "Write": {
          const writeContent = content as WriteToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={PenLineIcon}
              label={`Write file "${writeContent.input.file_path}"`}
            />
          );
        }
        case "Skill": {
          const skillContent = content as SkillToolUseMessageContent;
          return (
            <ChainOfThoughtStep
              key={step.id}
              icon={SparkleIcon}
              label={`Load skill "${skillContent.input.skill}"`}
            />
          );
        }
        case "ToolSearch":
          return null;
        default:
          return (
            <ChainOfThoughtStep
              key={step.id}
              label={<MessageResponse>{content.name}</MessageResponse>}
            />
          );
      }
    }
  });
}
