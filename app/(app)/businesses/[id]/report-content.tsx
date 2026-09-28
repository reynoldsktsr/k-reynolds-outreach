import ReactMarkdown from "react-markdown";

export function ReportContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-neutral mt-2 max-w-none prose-headings:font-semibold prose-p:leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
