# MD Master Plugin for Eagle

This project is an example Eagle plugin. The plugin includes several files that need to be packaged in a specific structure for Eagle to load them.

## Bundling the Plugin

The easiest way to create the distributable archive is to run:

```bash
npm run bundle
```

This command executes `js/bundle.js` which creates `dist/md-master-plugin.zip`. The archive contains the following files at its root:

- `manifest.json`
- `js/main.js`
- `index.html`
- `js/plugin.js`
- `style.css`

You can import this zip file directly in Eagle via **Plugins → Install Plugin...**.

## Development

Tests can be executed with:

```bash
npm test
```

End-to-end tests run with Cypress:

```bash
npm run cypress
```
