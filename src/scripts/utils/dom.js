export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function el(tagName, attrs = {}, content = '') {
  const node = document.createElement(tagName);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (key === 'className') {
      node.className = value;
      continue;
    }
    if (key.startsWith('data-')) {
      node.setAttribute(key, value);
      continue;
    }
    node[key] = value;
  }

  if (typeof content === 'string') {
    node.textContent = content;
  } else if (content instanceof Node) {
    node.append(content);
  }

  return node;
}

export function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}
