figma.showUI(__html__, { width: 340, height: 280 });

const LAYER_NAMES = ["post/title", "post/subtitle", "post/body", "post/logo-usage"];

function findNodesByName(node, names) {
  const found = {};
  if (names.includes(node.name)) {
    found[node.name] = node;
  }
  if ("children" in node) {
    for (const child of node.children) {
      Object.assign(found, findNodesByName(child, names));
    }
  }
  return found;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "populate") return;

  const { postId, webAppUrl } = msg;

  if (!postId || !webAppUrl) {
    figma.ui.postMessage({ type: "error", message: "Post ID and web app URL are required." });
    return;
  }

  // Fetch content from the web app
  let content;
  try {
    const res = await fetch(`${webAppUrl.replace(/\/$/, "")}/api/figma/payload/${postId}`);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      figma.ui.postMessage({ type: "error", message: json.error || `Failed to fetch post (${res.status})` });
      return;
    }
    content = await res.json();
  } catch (err) {
    figma.ui.postMessage({ type: "error", message: `Network error: ${err.message}` });
    return;
  }

  // Find the selected frame
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: "error", message: "Select a frame in Figma first." });
    return;
  }

  const frame = selection[0];

  // Recursively find text layers by name
  const layerMap = {
    "post/title": content.title,
    "post/subtitle": content.subtitle,
    "post/body": content.body,
    "post/logo-usage": content.logoUsage,
  };

  const found = findNodesByName(frame, LAYER_NAMES);
  const foundNames = Object.keys(found);

  if (foundNames.length === 0) {
    figma.ui.postMessage({
      type: "error",
      message: "No matching layers found. Ensure layers are named: post/title, post/subtitle, post/body, post/logo-usage",
    });
    return;
  }

  // Populate each found text layer
  let updated = 0;
  for (const name of foundNames) {
    const node = found[name];
    if (node.type === "TEXT" && layerMap[name] !== undefined) {
      await figma.loadFontAsync(node.fontName);
      node.characters = layerMap[name];
      updated++;
    }
  }

  figma.ui.postMessage({
    type: "success",
    message: `Updated ${updated} of ${LAYER_NAMES.length} layers successfully.`,
  });
};
