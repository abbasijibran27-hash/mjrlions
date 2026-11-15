"""MJR LION AGENCY — service photo pipeline.
Natural photographic finish + brand recolour (teal/cyan screens -> MJR gold on black).
usage: python3 prepare_photo.py <src> <out_base> [--clean-wm1]
writes <out_base>-1600.webp, <out_base>-960.webp, <out_base>-preview.png
"""
import sys, cv2, numpy as np
from PIL import Image

GOLD_H = 19.0      # OpenCV hue (0-180) ≈ 38°, MJR gold #d6b26e


def clean_watermark_1(img):
    """remove the small generator icon in the top-right corner of the Web Development photo"""
    H, W = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    YY, XX = np.mgrid[0:H, 0:W]
    mask = np.zeros((H, W), np.uint8)
    sel = (XX >= 1572) & (XX < 1638) & (YY >= 22) & (YY < 72) & (gray > 40) & ~((XX <= 1591) & (YY >= 43)) & (YY < 69)
    mask[sel] = 255
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=2)
    mask[(XX <= 1591) & (YY >= 44)] = 0
    mask[YY >= 70] = 0
    tmp = img.copy()
    tmp[(XX >= 1570) & (XX <= 1592) & (YY >= 38) & (YY <= 80)] = np.median(img[5:20, 1600:1660].reshape(-1, 3), axis=0)
    fill = cv2.inpaint(tmp, mask, 7, cv2.INPAINT_TELEA)
    out = img.copy(); out[mask > 0] = fill[mask > 0]
    blur = cv2.GaussianBlur(out, (5, 5), 0)
    soft = cv2.GaussianBlur(mask, (7, 7), 0).astype(np.float32) / 255.
    out = (out * (1 - soft[..., None] * .6) + blur * (soft[..., None] * .6)).astype(np.uint8)
    return out


def brand_recolour(img, bands=((89, 10, None),), protect=()):
    """turn teal / cyan UI colours into MJR gold on near-black; leave wood, plants, food, blue icons alone.
    bands: (hue_center, width, region_box_or_None). All bands are combined into ONE weight map and applied
    in a single RGB blend, so pixels never pass through green / olive."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    sat_w = np.clip((s - 15) / 45, 0, 1)                   # ignore neutral greys
    w = np.zeros(h.shape, np.float32)
    for center, width, region in bands:
        bw = np.exp(-((h - center) / width) ** 2) * sat_w
        if region:                                         # only inside a feathered box
            x0, y0, x1, y1 = region
            box = np.zeros(w.shape, np.float32); box[y0:y1, x0:x1] = 1
            bw = bw * cv2.GaussianBlur(box, (0, 0), 8)
        w = np.maximum(w, bw)
    for (x0, y0, x1, y1) in protect:                       # keep UI colour wheels etc. untouched
        w[y0:y1, x0:x1] = 0
    w = cv2.GaussianBlur(w, (0, 0), 1.0)[..., None]
    bright = np.clip((v - 60) / 110, 0, 1)                 # dark teal -> charcoal/bronze, bright teal -> gold
    rec = hsv.copy()
    rec[..., 0] = 14.5 + (GOLD_H - 14.5) * bright         # darker gold leans bronze (never olive)
    rec[..., 1] = s * (.20 + .55 * bright)
    rec[..., 2] = v * (.92 + .10 * bright)
    rec = cv2.cvtColor(np.clip(rec, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    out = img.astype(np.float32) * (1 - w) + rec * w
    return np.clip(out, 0, 255).astype(np.uint8)


def grade(img):
    f = img.astype(np.float32) / 255.
    H, W = f.shape[:2]
    lum = f.mean(axis=2, keepdims=True)
    f[..., 2] *= 1 + .03 * lum[..., 0]; f[..., 0] *= 1 - .03 * lum[..., 0]       # gentle warmth
    hsv = cv2.cvtColor((np.clip(f, 0, 1) * 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] *= .95                                                          # less "rendered" saturation
    f = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32) / 255.
    f = f + .06 * (f - .5) * (1 - np.abs(2 * f - 1))                           # soft S-curve
    f = f * .975 + .012                                                         # filmic black lift
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.sqrt(((xx - W * .55) / (W * .62)) ** 2 + ((yy - H * .48) / (H * .7)) ** 2)
    f *= (1 - .10 * np.clip(r - .55, 0, 1)[..., None] ** 1.4)                  # lens vignette
    return np.clip(f, 0, 1)


def finish(f, w, grain, amount, seed):
    im = cv2.resize(f, (w, round(f.shape[0] * w / f.shape[1])), interpolation=cv2.INTER_AREA)
    blur = cv2.GaussianBlur(im, (0, 0), 1.0)
    im = np.clip(im * (1 + amount) - blur * amount, 0, 1)                      # unsharp mask
    g = np.random.default_rng(seed).normal(0, grain / 255., im.shape[:2]).astype(np.float32)
    g = cv2.GaussianBlur(g, (0, 0), .6)[..., None]
    im = np.clip(im + g * (.6 + .4 * (1 - im.mean(axis=2, keepdims=True))), 0, 1)  # fine film grain
    return Image.fromarray((im[..., ::-1] * 255 + .5).astype(np.uint8))


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    img = cv2.imread(src)
    if '--clean-wm1' in sys.argv: img = clean_watermark_1(img)
    orig = img.copy()
    protect = [tuple(int(v) for v in a.split('=')[1].split(',')) for a in sys.argv if a.startswith('--protect=')]
    bands = [(89, 10, None)]
    for a in sys.argv:                                     # --region=x0,y0,x1,y1,hue  (extra teal-blue/green spots)
        if a.startswith('--region='):
            x0, y0, x1, y1, hc = [int(v) for v in a.split('=')[1].split(',')]
            bands.append((hc, 9, (x0, y0, x1, y1)))
    img = brand_recolour(img, bands, protect)
    for a in sys.argv:                                     # --warm=x0,y0,x1,y1  (olive-looking pastels -> warm gold)
        if a.startswith('--warm='):
            x0, y0, x1, y1 = [int(v) for v in a.split('=')[1].split(',')]
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
            box = np.zeros(hsv.shape[:2], np.float32); box[y0:y1, x0:x1] = 1
            box = cv2.GaussianBlur(box, (0, 0), 8)
            olive = np.exp(-((hsv[..., 0] - 26) / 8) ** 2) * np.clip((hsv[..., 1] - 15) / 30, 0, 1) * box
            hsv[..., 0] = hsv[..., 0] * (1 - olive) + 16 * olive
            hsv[..., 1] = np.minimum(255, hsv[..., 1] * (1 + .35 * olive))
            img = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)
    for a in sys.argv:                                     # --keep=x0,y0,x1,y1  (protect true colours, e.g. colour wheels)
        if a.startswith('--keep='):
            x0, y0, x1, y1 = [int(v) for v in a.split('=')[1].split(',')]
            box = np.zeros(img.shape[:2], np.float32); box[y0:y1, x0:x1] = 1
            box = cv2.GaussianBlur(box, (0, 0), 4)[..., None]
            img = (img.astype(np.float32) * (1 - box) + orig.astype(np.float32) * box).astype(np.uint8)
    f = grade(img)
    big, small = finish(f, 1600, 3.0, .45, 7), finish(f, 960, 2.4, .35, 8)
    big.save(out + '-1600.webp', 'WEBP', quality=84, method=6)
    small.save(out + '-960.webp', 'WEBP', quality=82, method=6)
    big.save(out + '-preview.png')
    print('ok', out)


def lqip(webp_path):
    """24px blurred preview as a data: URI (paste into IMAGE_LQIP in src/data.js)"""
    import base64, io
    im = Image.open(webp_path).convert('RGB').resize((24, 14), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=45)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
