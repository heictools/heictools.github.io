# Third-party software notices

Application code is MIT (see LICENSE). Libraries retain their own licenses.
Runtime dependencies are pinned and served from the same origin, not a CDN.

- **heic-to 1.6.7**, Hopper Gee: LGPL-3.0. Unmodified ESM module, copied from
  npm into /vendor/heic-to/next.js. https://github.com/hoppergee/heic-to
- **libheif 1.23.7**, struktur AG and contributors: LGPL-3.0, embedded in heic-to.
  https://github.com/strukturag/libheif
- **libde265 1.0.16**, struktur AG and contributors: LGPL-3.0, embedded in heic-to.
  https://github.com/strukturag/libde265
- **JSZip 3.10.2**, Stuart Knightley, David Duponchel, Franz Buchinger, António
  Afonso and contributors: dual MIT / GPL-3.0-or-later; MIT chosen here.
  https://github.com/Stuk/jszip
- JSZip's bundled dependencies: pako 1.0.11 (MIT AND Zlib), lie 3.3.0 (MIT),
  immediate 3.0.6 (MIT), readable-stream 2.3.8 (MIT), safe-buffer 5.1.2 (MIT),
  string_decoder 1.1.1 (MIT), util-deprecate 1.0.2 (MIT), inherits 2.0.4 (ISC),
  isarray 1.0.0 (MIT), process-nextick-args 2.0.1 (MIT), core-util-is 1.0.3 (MIT),
  setimmediate 1.0.5 (MIT). The lockfile identifies exact installed versions.
  Their complete notices are copied into /licenses/dependencies/ at build time.

Build/test tools (not shipped to visitors): esbuild (MIT), Playwright
(Apache-2.0), axe-core (MPL-2.0), @axe-core/playwright (MPL-2.0).

Full decoder license, GPL text, corresponding source archives, and modification
instructions are published under /licenses/. See third-party/BUILD.md. Decoder
replacement is supported; there is no restriction on reverse engineering to
debug modifications to LGPL components. No warranty is provided by these libraries.
