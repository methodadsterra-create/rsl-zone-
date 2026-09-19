import Poll from './Poll';

// Renders article text written with the editor toolbar. It is a small,
// deliberately limited markdown: **bold**, *italic*, [text](link), ## heading,
// > quote, - list, ![alt](image-url) and [poll:<id>]. Nothing is ever inserted
// as raw HTML, so pasted text cannot inject scripts. Old plain-text articles
// (one paragraph per line) render exactly as before.

const SAFE_LINK = /^(https?:\/\/|mailto:|\/)/i;
const INLINE = /\*\*(.+?)\*\*|\*([^\s*](?:[^*]*[^\s*])?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text, prefix = 'i') {
  const out = [];
  const re = new RegExp(INLINE.source, 'g');
  let last = 0;
  let n = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${prefix}-${n++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{inline(m[1], key)}</strong>);
    } else if (m[2] !== undefined) {
      out.push(<em key={key}>{inline(m[2], key)}</em>);
    } else if (SAFE_LINK.test(m[4])) {
      const external = /^https?:/i.test(m[4]);
      out.push(
        <a key={key} href={m[4]} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {inline(m[3], key)}
        </a>,
      );
    } else {
      out.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function parseBlocks(text = '') {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) { list = null; return; }
    let m;
    if ((m = line.match(/^\[poll:([0-9a-f-]{36})\]$/i))) {
      list = null; blocks.push({ type: 'poll', id: m[1] });
    } else if ((m = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/i))) {
      list = null; blocks.push({ type: 'img', alt: m[1], src: m[2] });
    } else if ((m = line.match(/^(#{2,3})\s+(.+)$/))) {
      list = null; blocks.push({ type: `h${m[1].length}`, text: m[2] });
    } else if ((m = line.match(/^>\s?(.+)$/))) {
      list = null; blocks.push({ type: 'quote', text: m[1] });
    } else if ((m = line.match(/^[-*]\s+(.+)$/))) {
      if (!list) { list = { type: 'ul', items: [] }; blocks.push(list); }
      list.items.push(m[1]);
    } else {
      list = null; blocks.push({ type: 'p', text: line });
    }
  });
  return blocks;
}

export default function RichContent({ text }) {
  return parseBlocks(text).map((b, i) => {
    switch (b.type) {
      case 'poll': return <Poll key={i} id={b.id} />;
      case 'img': return <figure key={i} className="article-figure"><img src={b.src} alt={b.alt} loading="lazy" />{b.alt && <figcaption>{b.alt}</figcaption>}</figure>;
      case 'h2': return <h2 key={i}>{inline(b.text)}</h2>;
      case 'h3': return <h3 key={i}>{inline(b.text)}</h3>;
      case 'quote': return <blockquote key={i}>{inline(b.text)}</blockquote>;
      case 'ul': return <ul key={i}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>;
      default: return <p key={i}>{inline(b.text)}</p>;
    }
  });
}
