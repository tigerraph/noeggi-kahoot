#!/usr/bin/env python3
"""Assemble the single-file game: src/ + assets/ -> dist/index.html (with build stamp)."""
import base64, json, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

def b64(p):
    return base64.b64encode(pathlib.Path(p).read_bytes()).decode()

FONTS = [
    ("Archivo Black", 400, "archivo-black/files/archivo-black-latin-400-normal.woff2"),
    ("Nunito", 700, "nunito/files/nunito-latin-700-normal.woff2"),
    ("Nunito", 800, "nunito/files/nunito-latin-800-normal.woff2"),
    ("Nunito", 900, "nunito/files/nunito-latin-900-normal.woff2"),
    ("Press Start 2P", 400, "press-start-2p/files/press-start-2p-latin-400-normal.woff2"),
]

def main():
    fdir = ROOT / "node_modules" / "@fontsource"
    font_css = "\n".join(
        f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;"
        f"src:url(data:font/woff2;base64,{b64(fdir / rel)}) format('woff2');}}"
        for fam, w, rel in FONTS)

    imgdir = ROOT / "assets" / "webimg_slim"
    imgs = {f.stem: "data:image/jpeg;base64," + b64(f) for f in sorted(imgdir.glob("*.jpg"))}

    data = json.loads((ROOT / "src" / "questions.json").read_text(encoding="utf-8"))
    build = (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)).strftime("Build %d.%m. · %H:%M")

    tpl = (ROOT / "src" / "template.html").read_text(encoding="utf-8")
    html = (tpl.replace("__FONT_CSS__", font_css)
               .replace("__IMG__", json.dumps(imgs))
               .replace("__DATA__", json.dumps(data, ensure_ascii=False))
               .replace("__BUILD__", build))

    out = ROOT / "dist" / "index.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"{out} | {out.stat().st_size/1048576:.2f} MB | {build}")

if __name__ == "__main__":
    main()
