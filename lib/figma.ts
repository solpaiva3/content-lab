export interface FigmaContent {
  title: string;
  subtitle: string;
  body: string;
  visualDescription: string;
  logoUsage: string;
}

export async function sendToFigma(
  frameId: string,
  content: FigmaContent
): Promise<void> {
  const accessToken = process.env.FIGMA_ACCESS_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;

  if (!accessToken || !fileKey) {
    throw new Error("Figma not configured");
  }

  // Fetch the current file to find layer IDs
  const fileRes = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${frameId}`,
    {
      headers: { "X-Figma-Token": accessToken },
    }
  );

  if (!fileRes.ok) {
    throw new Error(`Figma API error: ${fileRes.status}`);
  }

  const fileData = await fileRes.json();
  const frame = fileData.nodes?.[frameId.replace("-", ":")]?.document;

  if (!frame) {
    throw new Error("Frame not found in Figma file");
  }

  // Find text layers by name
  const layerMap: Record<string, string> = {
    "post/title": content.title,
    "post/subtitle": content.subtitle,
    "post/body": content.body,
    "post/visual-description": content.visualDescription,
    "post/logo-usage": content.logoUsage,
  };

  const updates = findLayersInFrame(frame, layerMap);

  if (updates.length === 0) {
    throw new Error("No matching layers found in the Figma frame");
  }

  // Batch update text nodes
  const updateRes = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/variables/local`,
    {
      method: "POST",
      headers: {
        "X-Figma-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nodes: updates }),
    }
  );

  if (!updateRes.ok) {
    throw new Error(`Figma update error: ${updateRes.status}`);
  }
}

function findLayersInFrame(
  node: Record<string, unknown>,
  layerMap: Record<string, string>
): Array<{ nodeId: string; characters: string }> {
  const results: Array<{ nodeId: string; characters: string }> = [];

  function traverse(n: Record<string, unknown>) {
    if (typeof n.name === "string" && n.name in layerMap && n.type === "TEXT") {
      results.push({
        nodeId: n.id as string,
        characters: layerMap[n.name],
      });
    }
    const children = n.children as Record<string, unknown>[] | undefined;
    if (Array.isArray(children)) {
      for (const child of children) {
        traverse(child as Record<string, unknown>);
      }
    }
  }

  traverse(node);
  return results;
}
