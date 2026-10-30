# Verification and release checklist

## Automated coverage

Run `npm test`, `npm run build`, and `npm run test:browser`. The build also checks
unique titles/descriptions, one H1, and every local HTML link and anchor.

Unit tests cover output names, ZIP collisions (including Unicode normalization
and case), resize math and validation, container sniffing, sequential queue
processing, additions during work, isolated failures, retry, cancellation,
late-result disposal, and TIFF orientation handling. The EXIF reader is tested
against both EXIF-only and container-rotated fixtures to avoid double rotation.

Five browser scenarios run across five projects: desktop Chromium, Firefox,
WebKit, mobile Chromium, and mobile WebKit. They use actual HEIC files and real
decoding, with no converter mocks. They inspect downloaded JPEG bytes and ZIP
contents, assert dimensions and orientation/color-quadrant locations, verify
metadata removal, and check responsive overflow, keyboard focus, and axe WCAG
2/2.1 A/AA results before and after conversion. Request monitoring checks for
non-GET uploads or off-origin HTTP requests during the conversion/download flow.

Fixtures are synthetic, MIT licensed, generated locally. Included source
metadata covers EXIF orientation and an sRGB ICC profile. A large fixture has
4032 × 2688 pixels. The truncated fixture tests a genuine decoder failure,
not just filename rejection. Browser-controlled download filenames may replace
spaces (observed in Playwright WebKit); the application's download attribute and
ZIP entries preserve them.

## Manual checks still required for broad device certification

No real camera photos were supplied with the brief. Do not describe this test
suite as validation of all iPhones, HDR fidelity, or physical mobile memory use.
Use non-sensitive photos you own for this matrix; do not commit private photos.

| Source / environment | What to inspect |
| --- | --- |
| Several iPhone generations, front/rear cameras | Primary image, orientation, skin tones, fine detail |
| Portrait and landscape, edited and unedited captures | No double rotation or mirror inversion |
| Display P3 and other ICC profiles | Compare against native Photos; document color shifts |
| HDR / gain maps / 10-bit photos | Highlight/contrast changes; no HDR preservation claim |
| 48 MP photos and panoramas | Peak memory, decode failures, size presets |
| Physical iPhone Safari and Android Chrome | Picker, file download locations, ZIP extraction, background-tab behavior |
| Recent desktop Safari, Chrome, Firefox, Edge | UI, clipboard/file selection, downloads, worker support |
| Large batches on low-memory devices | Responsiveness, cancellation, warning, download/clear recovery |
| Real EXIF/GPS metadata | Confirm original tags are absent; visible image content remains |

Playwright WebKit is not the shipping Safari binary; device emulation is not
physical hardware. Chromium is not a direct test of Microsoft Edge policies.
JPEG output is lossy; profile and HDR preservation are expressly unsupported.
Keep original photos and prefer native export for color-critical work.

## Manual privacy check

1. Open the site with a clean browser profile and DevTools Network recording.
2. Select a distinctive, non-sensitive local fixture and convert it.
3. Inspect every request, including those initiated by workers. Only same-origin
   GETs for public code/assets should occur. There should be no photo-body uploads,
   filename query strings, tracking pixels, or external conversion requests.
4. Generate a ZIP and inspect requests again. JSZip downloads from the same origin;
   JPEG entries are assembled locally. Browser downloads use blob URLs.
5. Clear the queue. Confirm results disappear, download links are revoked, and
   reloading does not restore the queue. Saved downloads remain on disk.

## Visual and performance review

Review empty, processing, successful, failed, and mixed states at narrow and wide
widths. Try keyboard-only navigation and a screen reader. Automated accessibility
checks do not certify complete accessibility. Test very long names and errors.

Use PageSpeed Insights on the deployed site and record device/network settings
with each lab result. The initial page avoids loading the decoder; first conversion
includes its fetch/initialization cost. Core Web Vitals need field data before any
field-performance claim. Inspect memory after repeated convert/remove cycles and
verify cancellation terminates active worker trees.

## Release record

See repository commit history and GitHub Actions for exact test results tied to
source revisions. A passing deploy workflow means unit, build/link, and browser
checks passed on that revision. It does not imply that the manual matrix above
has been completed. The initial delivery visually inspected desktop and mobile
layouts and exercised real synthetic image conversion in the browser engines.
