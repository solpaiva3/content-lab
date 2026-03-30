import { NextRequest, NextResponse } from "next/server";

// Cache layer name → node ID after first successful GET, keyed by frameId
const nodeIdCache = new Map<string, Record<string, string>>();

function findNodesByName(node: Record<string, unknown>, names: string[]): Record<string, string> {
  const found: Record<string, string> = {};
  if (typeof node.name === "string" && names.includes(node.name)) {
    found[node.name] = node.id as string;
  }
  const children = node.children as Record<string, unknown>[] | undefined;
  if (Array.isArray(children)) {
    for (const child of children) {
      Object.assign(found, findNodesByName(child as Record<string, unknown>, names));
    }
  }
  return found;
}

const LAYER_NAMES = ["post/title", "post/subtitle", "post/body", "post/logo-usage"];

export async function POST(req: NextRequest) {
  const { content } = await req.json();

  const accessToken = process.env.FIGMA_ACCESS_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;
  const rawFrameId = process.env.FIGMA_FRAME_ID;

  if (!accessToken || !fileKey || !rawFrameId) {
    return NextResponse.json({ error: "FIGMA_NOT_CONFIGURED" }, { status: 503 });
  }

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const cleanFrameId = rawFrameId.split("&")[0].split("?")[0];
  const nodeId = cleanFrameId.replace(/-/g, ":");

  try {
    // Step 1: resolve layer node IDs — use cache to avoid repeated GET calls
    let layerIds = nodeIdCache.get(nodeId);

    if (!layerIds) {
      const getUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;
      console.log("[figma/send] GET (cache miss)", getUrl);

      const fileRes = await fetch(getUrl, {
        headers: { "X-Figma-Token": accessToken },
      });

      if (!fileRes.ok) {
        const body = await fileRes.text();
        console.error("[figma/send] GET error", fileRes.status, body);
        return NextResponse.json(
          { error: `Figma API error: ${fileRes.status} ${fileRes.statusText} — ${body}` },
          { status: 502 }
        );
      }

      const fileData = await fileRes.json();
      const frame = fileData.nodes?.[nodeId]?.document;

      if (!frame) {
        const available = Object.keys(fileData.nodes ?? {}).join(", ");
        return NextResponse.json(
          { error: `Frame "${nodeId}" not found. Available nodes: ${available || "none"}` },
          { status: 404 }
        );
      }

      layerIds = findNodesByName(frame, LAYER_NAMES);
      console.log("[figma/send] found layers:", layerIds);

      if (Object.keys(layerIds).length === 0) {
        return NextResponse.json(
          {
            error:
              "No matching text layers found in the frame. " +
              "Ensure layers are named: post/title, post/subtitle, post/body, post/logo-usage",
          },
          { status: 422 }
        );
      }

      nodeIdCache.set(nodeId, layerIds);
    } else {
      console.log("[figma/send] using cached layer IDs for", nodeId);
    }

    // Step 2: build the single batched PATCH body
    const layerMap: Record<string, string> = {
      "post/title": content.title,
      "post/subtitle": content.subtitle,
      "post/body": content.body,
      "post/logo-usage": content.logoUsage,
    };

    const nodes: Record<string, { characters: string }> = {};
    for (const [name, id] of Object.entries(layerIds)) {
      if (layerMap[name] !== undefined) {
        nodes[id] = { characters: layerMap[name] };
      }
    }

    // Step 3: 500ms delay before PATCH to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));

    const patchUrl = `https://api.figma.com/v1/files/${fileKey}/nodes`;
    console.log("[figma/send] PATCH", patchUrl, JSON.stringify({ nodes }));

    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "X-Figma-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nodes }),
    });

    if (!patchRes.ok) {
      const body = await patchRes.text();
      console.error("[figma/send] PATCH error", patchRes.status, body);
      // Clear cache on error so next call re-fetches node IDs
      nodeIdCache.delete(nodeId);
      return NextResponse.json(
        { error: `Figma update error: ${patchRes.status} ${patchRes.statusText} — ${body}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      layersUpdated: Object.keys(nodes).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[figma/send] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
