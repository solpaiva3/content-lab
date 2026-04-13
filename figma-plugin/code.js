figma.showUI(__html__, { width: 360, height: 600 });

// ── Layer name constants ───────────────────────────────────────────────────────

const TEXT_LAYER_NAMES = ["post/title", "post/subtitle", "post/body", "post/logo-usage"];
const LOGO_LAYER_NAME  = "post/logo";
const IMAGE_LAYER_NAME = "post/image";

// Slide type → human label (mirrors the web app)
const SLIDE_LABELS = {
  hook:       "Hook",
  context:    "Context",
  problem:    "Problem",
  insight:    "Insight",
  cta:        "CTA",
  setup:      "Setup",
  shift:      "Shift",
  resolution: "Resolution",
  tension:    "Tension",
};

// ── Generic tree helpers ──────────────────────────────────────────────────────

function findNodesByName(node, names) {
  const found = {};
  if (names.includes(node.name)) {
    if (node.type === "TEXT") {
      found[node.name] = node;
    } else {
      const textChild = findFirstTextNode(node);
      if (textChild) found[node.name] = textChild;
    }
    return found; // don't recurse into a matched node
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

// Search the entire current page for the first frame/component with an exact name
function findPageFrameByName(name) {
  function search(node) {
    if (node.name === name &&
        (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "COMPONENT_SET")) {
      return node;
    }
    if ("children" in node) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  }
  return search(figma.currentPage);
}

// ── Template frame lookup ─────────────────────────────────────────────────────

// Naming convention: template/{templateId}/{slideType}
// e.g.  template/educational-5/hook
//       template/educational-5/context
function findTemplateFrames(templateId, slideTypes) {
  const frames  = {}; // slideType → node
  const missing = []; // frame names not found
  const found   = []; // frame names found

  for (const type of slideTypes) {
    const frameName = `template/${templateId}/${type}`;
    const frame = findPageFrameByName(frameName);
    if (frame) {
      frames[type] = frame;
      found.push(frameName);
    } else {
      missing.push(frameName);
    }
  }

  return { frames, missing, found };
}

// Compute the collective bounding box of an array of nodes
function getBoundingBox(nodes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  return { x: minX, y: minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// ── Text + logo population ────────────────────────────────────────────────────

async function populateTextLayers(frame, layerMap) {
  const found = findNodesByName(frame, TEXT_LAYER_NAMES);
  let updated = 0;
  for (const name of Object.keys(found)) {
    if (layerMap[name] !== undefined) {
      const node = found[name];
      await figma.loadFontAsync(node.fontName);
      if (layerMap[name] === null) {
        node.visible = false;
      } else {
        node.visible = true;
        node.characters = String(layerMap[name]);
      }
      updated++;
    }
  }
  return updated;
}

// Find the first node in the tree whose type is in the given list
function findFirstNodeOfTypes(node, types) {
  if (types.includes(node.type)) return node;
  if ("children" in node) {
    for (const child of node.children) {
      const found = findFirstNodeOfTypes(child, types);
      if (found) return found;
    }
  }
  return null;
}

function findNodeByNameInTree(node, name) {
  if (node.name === name) return node;
  if ("children" in node) {
    for (const child of node.children) {
      const found = findNodeByNameInTree(child, name);
      if (found) return found;
    }
  }
  return null;
}

// Returns a debug object:
// { applied, method, nodeType, nodeName, childrenBefore, childrenAfter, error }
function applyLogoToNode(node, logoBytes) {
  const image     = figma.createImage(logoBytes);
  const imageFill = { type: "IMAGE", scaleMode: "FIT", imageHash: image.hash };

  const dbg = {
    applied: false,
    method: null,
    nodeType: node.type,
    nodeName: node.name,
    childrenBefore: "children" in node ? node.children.length : "n/a",
    childrenAfter: null,
    error: null,
  };

  // ── Direct shape (RECTANGLE, ELLIPSE, VECTOR) ─────────────────────────────
  // Replaces the fills array entirely — no stacking possible.
  if (node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "VECTOR") {
    node.fills   = [imageFill];
    dbg.applied  = true;
    dbg.method   = "shape:fills-replaced";
    return dbg;
  }

  // ── INSTANCE / COMPONENT ──────────────────────────────────────────────────
  // Figma does NOT allow removing children from an instance — doing so throws.
  // Instead: find the first inner RECTANGLE or ELLIPSE (image placeholder) and
  // replace its fills as an override. This is the safe, supported approach.
  if (node.type === "INSTANCE" || node.type === "COMPONENT") {
    const placeholder = findFirstNodeOfTypes(node, ["RECTANGLE", "ELLIPSE"]);
    if (placeholder) {
      placeholder.fills = [imageFill];
      dbg.applied = true;
      dbg.method  = `instance:inner-placeholder-fills (${placeholder.type} "${placeholder.name}")`;
      return dbg;
    }
    // No inner placeholder — try setting fills directly on the instance node
    try {
      node.fills   = [imageFill];
      dbg.applied  = true;
      dbg.method   = "instance:direct-fills";
    } catch (e) {
      dbg.error   = e.message || String(e);
      dbg.method  = "instance:failed";
    }
    return dbg;
  }

  // ── FRAME ─────────────────────────────────────────────────────────────────
  // Remove all children first, then set fill on the frame background.
  if (node.type === "FRAME") {
    const before = node.children.length;
    const snapshot = [...node.children];
    for (const child of snapshot) {
      try { child.remove(); } catch (e) { /* skip undeletable children */ }
    }
    dbg.childrenBefore = before;
    dbg.childrenAfter  = node.children.length;
    node.fills         = [imageFill];
    dbg.applied        = true;
    dbg.method         = `frame:cleared(${before}→${dbg.childrenAfter})+fill`;
    return dbg;
  }

  // ── GROUP ─────────────────────────────────────────────────────────────────
  // Groups don't support fills. Clear children, insert a covering rectangle.
  if (node.type === "GROUP") {
    const before   = node.children.length;
    const snapshot = [...node.children];
    for (const child of snapshot) {
      try { child.remove(); } catch (e) { /* skip */ }
    }
    dbg.childrenBefore = before;
    dbg.childrenAfter  = node.children.length;
    const rect = figma.createRectangle();
    rect.resize(node.width || 100, node.height || 100);
    rect.x      = 0;
    rect.y      = 0;
    rect.fills  = [imageFill];
    node.appendChild(rect);
    dbg.applied = true;
    dbg.method  = `group:cleared(${before}→${dbg.childrenAfter})+rect`;
    return dbg;
  }

  // ── Unknown type ──────────────────────────────────────────────────────────
  try {
    node.fills   = [imageFill];
    dbg.applied  = true;
    dbg.method   = `unknown(${node.type}):direct-fills`;
  } catch (e) {
    dbg.error   = e.message || String(e);
    dbg.method  = `unknown(${node.type}):failed`;
  }
  return dbg;
}

// Returns a human-readable debug string, or an error string if logo not found.
function applyLogo(frame, logoBytes) {
  if (!logoBytes) return "⚠ No logo bytes received.";

  const logoLayer = findNodeByNameInTree(frame, LOGO_LAYER_NAME);
  if (!logoLayer) {
    return (
      `⚠ No layer named "${LOGO_LAYER_NAME}" found inside "${frame.name}". ` +
      `Rename your logo placeholder to exactly: ${LOGO_LAYER_NAME}`
    );
  }

  const dbg = applyLogoToNode(logoLayer, logoBytes);

  // Build a compact debug line: type | name | children | method | applied
  const childInfo = dbg.childrenBefore !== "n/a"
    ? ` | children ${dbg.childrenBefore}→${dbg.childrenAfter !== null ? dbg.childrenAfter : dbg.childrenBefore}`
    : "";
  const status = dbg.applied ? "✓" : "✗";

  return (
    `${status} logo [${dbg.nodeType} "${dbg.nodeName}"${childInfo}] → ${dbg.method}` +
    (dbg.error ? ` | error: ${dbg.error}` : "")
  );
}

// ── Slide image (post/image layer) ───────────────────────────────────────────

// Applies per-slide image bytes to the "post/image" layer in a frame.
// Always searches for the layer and returns a status string (never null).
// If imageBytes is not provided, returns a "layer found/not-found, no image" message.
function applySlideImage(frame, imageBytes) {
  // Always search — even without bytes — so callers can see layer presence in debug output
  const imageLayer = findNodeByNameInTree(frame, IMAGE_LAYER_NAME);

  if (!imageLayer) {
    return `⚠ "${IMAGE_LAYER_NAME}" not found in "${frame.name}" (searched all descendants)`;
  }

  // Layer found but no image uploaded for this slide
  if (!imageBytes) {
    return `• "${IMAGE_LAYER_NAME}" found (${imageLayer.type} "${imageLayer.name}") — no image for this slide`;
  }

  try {
    const image     = figma.createImage(imageBytes);
    const imageFill = { type: "IMAGE", scaleMode: "FILL", imageHash: image.hash };

    if (imageLayer.type === "FRAME") {
      const snapshot = [...imageLayer.children];
      for (const child of snapshot) { try { child.remove(); } catch (_) {} }
      imageLayer.fills = [imageFill];
    } else if (imageLayer.type === "INSTANCE" || imageLayer.type === "COMPONENT") {
      const placeholder = findFirstNodeOfTypes(imageLayer, ["RECTANGLE", "ELLIPSE"]);
      if (placeholder) placeholder.fills = [imageFill];
      else imageLayer.fills = [imageFill];
    } else {
      imageLayer.fills = [imageFill];
    }
    return `✓ image applied to "${IMAGE_LAYER_NAME}" (${imageLayer.type} "${imageLayer.name}", ${imageBytes.length} bytes)`;
  } catch (e) {
    return `✗ image apply failed on "${IMAGE_LAYER_NAME}": ${e.message || String(e)}`;
  }
}

// ── Template-aware carousel (primary path) ────────────────────────────────────

// Returns "ok" | "partial-missing" | "none-found"
async function populateTemplateCarousel(templateId, slides, logoUsage, logoBytes, imageSlots) {
  const slideTypes = slides.map(s => s.type);
  const { frames, missing, found } = findTemplateFrames(templateId, slideTypes);

  // Some frames found, some not → hard error (tells designer exactly what's missing)
  if (found.length > 0 && missing.length > 0) {
    figma.ui.postMessage({
      type: "error",
      message:
        `Missing template frames (${missing.length} of ${slideTypes.length}):\n` +
        missing.map(n => `• ${n}`).join("\n") +
        `\n\nCreate these frames in Figma to use template mode.`,
    });
    return "partial-missing";
  }

  // No frames found at all → signal to caller so it can fall back
  if (found.length === 0) {
    return "none-found";
  }

  // All frames found → generate carousel
  const GAP = 40;
  const masterFrames = Object.values(frames);
  const bbox = getBoundingBox(masterFrames);

  // Place generated slides below the master frames area, left-aligned with them
  const startX = bbox.x;
  const startY = bbox.maxY + 120;

  const createdFrames = [];
  const logoDebugLines = [];
  let currentX = startX;

  for (let i = 0; i < slides.length; i++) {
    const slide  = slides[i];
    const label  = SLIDE_LABELS[slide.type] || slide.type;
    const master = frames[slide.type];

    const clone = master.clone();
    clone.name  = `Slide ${i + 1} — ${label}`;
    clone.x     = currentX;
    clone.y     = startY;

    const layerMap = {
      "post/title":      slide.title    || null,
      "post/subtitle":   slide.subtitle || null,
      "post/body":       slide.body     || null,
      "post/logo-usage": i === slides.length - 1 ? (logoUsage || null) : null,
    };
    await populateTextLayers(clone, layerMap);
    const logoLine = applyLogo(clone, logoBytes);
    const imgLine  = applySlideImage(clone, imageSlots[i] || null);
    logoDebugLines.push(`  [${i + 1}] ${logoLine} | img: ${imgLine}`);

    figma.currentPage.insertChild(figma.currentPage.children.length, clone);
    createdFrames.push(clone);
    currentX += clone.width + GAP;
  }

  figma.currentPage.selection = createdFrames;
  figma.viewport.scrollAndZoomIntoView(createdFrames);

  figma.ui.postMessage({
    type: "success",
    message:
      `Carousel generated: ${createdFrames.length} slides · template "${templateId}".\n\n` +
      `Debug:\n${logoDebugLines.join("\n")}`,
  });
  return "ok";
}

// ── Fallback: single selected base frame ──────────────────────────────────────

async function populateFallbackCarousel(baseFrame, slides, logoUsage, logoBytes, imageSlots) {
  const GAP = 40;
  const baseX = baseFrame.x;
  const baseY = baseFrame.y;

  const firstSlide = slides[0];
  const firstLabel = SLIDE_LABELS[firstSlide.type] || firstSlide.type;
  baseFrame.name = `Slide 1 — ${firstLabel}`;

  await populateTextLayers(baseFrame, {
    "post/title":      firstSlide.title    || null,
    "post/subtitle":   firstSlide.subtitle || null,
    "post/body":       firstSlide.body     || null,
    "post/logo-usage": null,
  });
  const logoDebugLines = [];
  const imgLine0 = applySlideImage(baseFrame, imageSlots[0] || null);
  logoDebugLines.push(`  [1] ${applyLogo(baseFrame, logoBytes)} | img: ${imgLine0}`);

  const createdFrames = [baseFrame];
  for (let i = 1; i < slides.length; i++) {
    const slide = slides[i];
    const label = SLIDE_LABELS[slide.type] || slide.type;

    const clone = baseFrame.clone();
    clone.name  = `Slide ${i + 1} — ${label}`;
    clone.x     = baseX + (baseFrame.width + GAP) * i;
    clone.y     = baseY;

    await populateTextLayers(clone, {
      "post/title":      slide.title    || null,
      "post/subtitle":   slide.subtitle || null,
      "post/body":       slide.body     || null,
      "post/logo-usage": i === slides.length - 1 ? (logoUsage || null) : null,
    });
    const imgLine = applySlideImage(clone, imageSlots[i] || null);
    logoDebugLines.push(`  [${i + 1}] ${applyLogo(clone, logoBytes)} | img: ${imgLine}`);

    figma.currentPage.insertChild(figma.currentPage.children.length, clone);
    createdFrames.push(clone);
  }

  figma.currentPage.selection = createdFrames;
  figma.viewport.scrollAndZoomIntoView(createdFrames);

  figma.ui.postMessage({
    type: "success",
    message:
      `Carousel generated: ${createdFrames.length} slides (fallback mode).\n\n` +
      `Debug:\n${logoDebugLines.join("\n")}`,
  });
}

async function populateSingleFrame(frame, content, logoBytes) {
  const layerMap = {
    "post/title":      content.title     || null,
    "post/subtitle":   content.subtitle  || null,
    "post/body":       content.body      || null,
    "post/logo-usage": content.logoUsage || null,
  };
  const updated = await populateTextLayers(frame, layerMap);
  const logoMsg = applyLogo(frame, logoBytes);
  figma.ui.postMessage({
    type: updated > 0 || logoBytes ? "success" : "error",
    message: `Updated ${updated} of ${TEXT_LAYER_NAMES.length} text layers.${logoMsg}`,
  });
}

// ── Main message handler ──────────────────────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "populate") return;

  const { content, logoBytes: rawLogoBytes, imageSlots: rawImageSlots } = msg;

  // Reconstruct Uint8Array from plain number[] (postMessage strips typed arrays)
  const logoBytes   = rawLogoBytes   ? new Uint8Array(rawLogoBytes)  : null;
  const imageSlots  = Array.isArray(rawImageSlots)
    ? rawImageSlots.map(function(s) { return s ? new Uint8Array(s) : null; })
    : [];

  const isCarousel = Array.isArray(content.slides) && content.slides.length > 0;

  // ── Primary: template-aware path ──────────────────────────────────────────
  if (isCarousel && content.templateId) {
    const result = await populateTemplateCarousel(
      content.templateId,
      content.slides,
      content.logoUsage || "",
      logoBytes,
      imageSlots
    );
    // "ok" or "partial-missing" → done (success or error already sent to UI)
    if (result !== "none-found") return;
    // "none-found" → fall through to fallback
  }

  // ── Fallback: require a manually selected frame ────────────────────────────
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    const hint = isCarousel && content.templateId
      ? `No frames found for template "${content.templateId}".\n\nCreate frames named:\n` +
        content.slides.map(s => `• template/${content.templateId}/${s.type}`).join("\n") +
        `\n\nOr select a base frame to use as fallback.`
      : "Select a base frame in Figma first.";
    figma.ui.postMessage({ type: "error", message: hint });
    return;
  }

  const frame = selection[0];

  if (isCarousel) {
    await populateFallbackCarousel(frame, content.slides, content.logoUsage || "", logoBytes, imageSlots);
    return;
  }

  await populateSingleFrame(frame, content, logoBytes);
};
