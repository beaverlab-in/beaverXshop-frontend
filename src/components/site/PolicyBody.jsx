import Link from "next/link";

// A deliberately small, safe renderer for staff-written policy text. It builds React elements (nothing is injected as HTML) and
// supports only: paragraphs, "- " lists, pipe tables, **bold**, _italic_ and [links](/path or https://…).

const SAFE_LINK = /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/;

function inline(text, keyBase = "i") {
  const parts = [];
  const re = /\*\*([^*]+)\*\*|_([^_]+)_|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const key = `${keyBase}-${n++}`;
    if (m[1]) parts.push(<strong key={key}>{m[1]}</strong>);
    else if (m[2]) parts.push(<em key={key} className={m[2].startsWith("[not provided") ? "rounded bg-warning/15 px-1 not-italic text-warning-ink" : ""}>{m[2]}</em>);
    else if (SAFE_LINK.test(m[4])) {
      const cls = "font-medium text-brand underline underline-offset-4";
      parts.push(m[4].startsWith("/") ? <Link key={key} href={m[4]} className={cls}>{m[3]}</Link> : <a key={key} href={m[4]} rel="noopener noreferrer" className={cls}>{m[3]}</a>);
    } else parts.push(m[3]);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Table({ lines }) {
  const rows = lines.map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
  const [head, , ...body] = rows;
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead className="bg-subtle">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="px-3 py-2 font-semibold">{inline(h)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i} className="border-t border-line align-top">
              {r.map((c, j) => <td key={j} className="px-3 py-2">{inline(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PolicyBody({ text }) {
  const blocks = String(text).split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4 leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.trim().startsWith("|"))) return <Table key={i} lines={lines} />;
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-6">
              {lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}
            </ul>
          );
        }
        return <p key={i} className="whitespace-pre-line">{inline(block)}</p>;
      })}
    </div>
  );
}
