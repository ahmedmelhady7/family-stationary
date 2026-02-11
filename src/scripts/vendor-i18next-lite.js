function readPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

class I18NextLite {
  constructor() {
    this.options = {};
    this.resources = {};
    this.language = 'ar';
  }

  use() {
    return this;
  }

  async init(options = {}) {
    this.options = {
      lng: options.lng || 'ar',
      fallbackLng: options.fallbackLng || 'ar',
      ns: options.ns || ['common'],
      defaultNS: options.defaultNS || 'common',
      backend: options.backend || { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    };

    this.language = this.options.lng;

    await Promise.all(
      this.options.ns.map(async (ns) => {
        const path = this.options.backend.loadPath
          .replace('{{lng}}', this.language)
          .replace('{{ns}}', ns);

        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to load ${path}`);
          }
          this.resources[ns] = await response.json();
        } catch (_error) {
          this.resources[ns] = {};
        }
      }),
    );

    return this;
  }

  t(key, vars = {}) {
    const [maybeNs, ...rest] = key.split(':');
    const hasNamespace = rest.length > 0;
    const namespace = hasNamespace ? maybeNs : this.options.defaultNS;
    const path = hasNamespace ? rest.join(':') : maybeNs;

    const value = readPath(this.resources[namespace] || {}, path);
    let text = typeof value === 'string' ? value : vars.defaultValue || key;

    for (const [varName, varValue] of Object.entries(vars)) {
      if (varName === 'defaultValue') {
        continue;
      }
      text = text.replaceAll(`{{${varName}}}`, String(varValue));
    }

    return text;
  }
}

const i18next = new I18NextLite();

export default i18next;
