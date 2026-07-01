import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Send, Loader2, Sparkles, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Career Assistant — CourseCompass" },
      { name: "description", content: "Ask anything about Nigerian university courses, careers, salaries and skills. Get empathetic, AI-powered guidance." },
      { property: "og:title", content: "AI Career Assistant — CourseCompass" },
      { property: "og:description", content: "Empathetic AI guidance for Nigerian students about courses and careers." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "I wanted Medicine but got Physiology. What now?",
  "Is Statistics actually better than Computer Science?",
  "Can a Yoruba graduate work remotely?",
  "Best software for a Mass Communication student in 2025?",
  "Should I drop out and rewrite JAMB?",
];

function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };

  const send = (text: string) => {
    if (busy) return;
    sendMessage({ text });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 flex flex-col min-h-[calc(100vh-4rem)]">
      <header className="mb-4">
        <div className="flex items-center gap-2 text-gold text-xs uppercase tracking-wider">
          <Sparkles className="size-3.5" /> AI Career Assistant
        </div>
        <h1 className="font-display text-3xl font-semibold mt-1">
          Ask anything about your course or career
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Drafted by Claude, validated by GPT-5 for tone, structure & citations.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="glass rounded-xl p-5">
            <div className="text-sm font-medium mb-3">Try one of these:</div>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm rounded-lg border border-border/60 bg-surface-2/40 px-3 py-2 hover:border-primary/50 hover:text-primary transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {text}
                </div>
              </div>
            );
          }
          return (
            <AssistantMessage key={m.id} text={text} />
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Thinking…
          </div>
        )}

        {error && (
          <div className="text-sm text-rose-300">Something went wrong. Try again.</div>
        )}
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-0 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="glass rounded-2xl p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            rows={1}
            placeholder="Ask about your course, career, salary, skills..."
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none max-h-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="rounded-xl bg-primary p-2.5 text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
