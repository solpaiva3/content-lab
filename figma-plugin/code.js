figma.showUI(__html__, { width: 340, height: 360 });

const TEXT_LAYER_NAMES = ["post/title", "post/subtitle", "post/body", "post/logo-usage"];
const LOGO_LAYER_NAME = "post/logo";

function findNodesByName(node, names) {
  const found = {};
  if (names.includes(node.name)) {
    if (node.type === "TEXT") {
      found[node.name] = node;
    } else {
      // Named layer is a group/frame — find the first text node inside it
      const textChild = findFirstTextNode(node);
      if (textChild) found[node.name] = textChild;
    }
    // Don't recurse into a matched node — avoid double-matching children
    return found;
  }
  if ("children" in node) {
    for (const child of node.children) {
      Object.assign(found, findNodesByName(child, names));
    }
  }
  return found;
}

function findFirstTextNode(node) {
  if (node.type === "TEXT") return node;
  if ("children" in node) {
    for (const child of node.children) {
      const found = findFirstTextNode(child);
      if (found) return found;
    }
  }
  return null;
}

function findFirstFillableNode(node) {
  const fillable = ["RECTANGLE", "ELLIPSE", "VECTOR", "FRAME", "GROUP", "COMPONENT", "INSTANCE"];
  if (fillable.includes(node.type)) return node;
  if ("children" in node) {
    for (const child of node.children) {
      const found = findFirstFillableNode(child);
      if (found) return found;
    }
  }
  return null;
}

function findNodeByName(node, name) {
  if (node.name === name) return node;
  if ("children" in node) {
    for (const child of node.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }
  return null;
}

function applyImageFill(node, imageHash) {
  try {
    node.fills = [{ type: "IMAGE", scaleMode: "FIT", imageHash }];
    return true;
  } catch (e) {
    return false;
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "populate") return;

  const { content, logoBytes } = msg;

  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: "error", message: "Select a frame in Figma first." });
    return;
  }

  const frame = selection[0];

  const layerMap = {
    "post/title": content.title,
    "post/subtitle": content.subtitle,
    "post/body": content.body,
    "post/logo-usage": content.logoUsage,
  };

  // ── Populate text layers ─────────────────────────────────────────
  const found = findNodesByName(frame, TEXT_LAYER_NAMES);
  let updated = 0;

  for (const name of Object.keys(found)) {
    const node = found[name];
    if (layerMap[name] !== undefined) {
      await figma.loadFontAsync(node.fontName);
      node.characters = layerMap[name];
      updated++;
    }
  }

  // ── Populate logo image ──────────────────────────────────────────
  let logoMessage = "";
  if (logoBytes) {
    const logoLayer = findNodeByName(frame, LOGO_LAYER_NAME);
    if (logoLayer) {
      try {
        const image = figma.createImage(logoBytes);
        const nodeType = logoLayer.type;

        // Strategy 1: try to set fill directly on the logo layer
        const directApplied = applyImageFill(logoLayer, image.hash);
        if (directApplied) {
          logoMessage = ` Logo applied directly on ${nodeType}.`;
        } else {
          // Strategy 2: find first fillable child and apply there
          const inner = findFirstFillableNode(logoLayer);
          if (inner) {
            const innerApplied = applyImageFill(inner, image.hash);
            logoMessage = innerApplied
              ? ` Logo applied on inner ${inner.type} (${inner.name}).`
              : ` Logo inner ${inner.type} fill failed.`;
          } else {
            logoMessage = ` Logo layer is ${nodeType} "${logoLayer.name}" with no fillable child found. Children: ${
              "children" in logoLayer ? logoLayer.children.map(c => `${c.name}(${c.type})`).join(", ") : "none"
            }`;
          }
        }
      } catch (err) {
        logoMessage = ` Logo failed: ${err.message || String(err)}`;
      }
    } else {
      logoMessage = " No 'post/logo' layer found — check the layer name.";
    }
  } else {
    logoMessage = " No logo bytes received.";
  }

  figma.ui.postMessage({
    type: updated > 0 || logoBytes ? "success" : "error",
    message: `Updated ${updated} of ${TEXT_LAYER_NAMES.length} text layers.${logoMessage}`,
  });
};
