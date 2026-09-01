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
  if (block.type === "rubric") {
    return (
      <div className="description-rubric">
        {block.rows.map((row, rowIndex) => (
          <div className="description-rubric-row" key={rowIndex}>
            <div className="description-rubric-competency">{row.competency}</div>
            <div className="description-rubric-level">{row.level}</div>
            <p className="description-rubric-description">{row.description}</p>
          </div>
        ))}
      </div>
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
