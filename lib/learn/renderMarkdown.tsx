import React from 'react';

/** Minimal markdown → React for Learn articles (no external MD dependency). */
export function renderLearnMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="learn-md-hr" />);
      i += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = inline(heading[2]);
      if (level === 1) nodes.push(<h2 key={key++} className="learn-md-h2">{text}</h2>);
      else if (level === 2) nodes.push(<h2 key={key++} className="learn-md-h2">{text}</h2>);
      else nodes.push(<h3 key={key++} className="learn-md-h3">{text}</h3>);
      i += 1;
      continue;
    }

    if (/^\|/.test(line) && i + 1 < lines.length && /^\|?\s*-/.test(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      nodes.push(renderTable(tableLines, key++));
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(<li key={items.length}>{inline(lines[i].replace(/^[-*]\s+/, ''))}</li>);
        i += 1;
      }
      nodes.push(
        <ul key={key++} className="learn-md-ul">
          {items}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(<li key={items.length}>{inline(lines[i].replace(/^\d+\.\s+/, ''))}</li>);
        i += 1;
      }
      nodes.push(
        <ol key={key++} className="learn-md-ol">
          {items}
        </ol>,
      );
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^\|/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i += 1;
    }
    nodes.push(
      <p key={key++} className="learn-md-p">
        {inline(para.join(' '))}
      </p>,
    );
  }

  return nodes;
}

function renderTable(tableLines: string[], key: number): React.ReactNode {
  const rows = tableLines
    .filter((l) => !/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(l.trim()))
    .map((l) =>
      l
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim()),
    );

  if (rows.length === 0) return null;
  const [header, ...body] = rows;

  return (
    <div key={key} className="learn-md-table-wrap">
      <table className="learn-md-table">
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th key={i}>{inline(cell)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{inline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={k++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={k++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={k++} className="learn-md-code">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        const href = link[2];
        const safe = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/');
        nodes.push(
          safe ? (
            <a key={k++} href={href} className="learn-md-a" rel="noopener noreferrer">
              {link[1]}
            </a>
          ) : (
            link[1]
          ),
        );
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
