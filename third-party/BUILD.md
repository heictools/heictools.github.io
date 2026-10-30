# Corresponding source and replacement

The shipped decoder is the unmodified heic-to 1.6.7 `dist/next/heic-to.js`.
Its npm source distribution (included here) contains its original JavaScript
source, Emscripten-generated libheif/libde265 JavaScript, esbuild.mjs, and README.
The generated library identifies libheif 1.23.7 and libde265 1.0.16. Their source
archives are included alongside the decoder; each contains its license and build
scripts. Archives are not required for conversion and load only when requested.

To rebuild the wrapper: extract heic-to, install its build dependencies, then run
`node esbuild.mjs`. To rebuild the native decoder, follow the upstream README's
Emscripten build instructions: install Emscripten plus cmake/make/pkg-config and
run libheif's build-emscripten.sh with LIBDE265_VERSION=1.0.16 and USE_WASM=0.
The upstream README documents its exported-functions adjustment. Its build
script fetches the codec sources; use the included matching archives. The
upstream does not record the exact Emscripten compiler version, so a rebuild is
not claimed to be byte-for-byte identical.

Replace node_modules/heic-to/dist/next/heic-to.js before `npm run build`, or
replace dist/vendor/heic-to/next.js in a built site. Keep the heicTo API compatible.
The library stays a separate module: no integrity signature or access control
prevents loading a user-modified version. The project's MIT code is available
in the repository; reverse engineering to debug LGPL modifications is permitted.

Upstreams:
- https://github.com/hoppergee/heic-to/tree/78345a3fcdb4a1d70d513fce2646aeff0127f7ba
- https://github.com/strukturag/libheif/tree/v1.23.7
- https://github.com/strukturag/libde265/tree/v1.0.16
