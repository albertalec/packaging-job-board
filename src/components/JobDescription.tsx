import { parseJobDescription, type DescriptionBlock } from "@/lib/description";

function BlockView({ block }: { block: DescriptionBlock }) {
  if (block.type === "heading") {
    return <h2>{block.text}</h2>;
  }
  if (block.type === "list") {
    return (
      <ul>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.text}</p>;
}

export function JobDescription({
  text,
  blocks,
}: {
  text?: string;
  blocks?: DescriptionBlock[];
}) {
  const resolved = blocks ?? parseJobDescription(text ?? "");
  if (resolved.length === 0) return null;
  return (
    <div className="description">
      {resolved.map((block, index) => (
        <BlockView key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  );
}
