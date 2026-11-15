"""Team portrait: crop to 4:5, swap a plain white studio background for the MJR dark studio backdrop.
The person (face, clothing) is never altered beyond a gentle global tone curve."""
import sys, cv2, numpy as np
from PIL import Image

def portrait(src, out, top, bottom, white_bg=True, pad_top=0):
    im = cv2.imread(src)
    if pad_top:                                                     # more headroom: extend the plain backdrop upwards
        im = cv2.copyMakeBorder(im, pad_top, 0, 0, 0, cv2.BORDER_CONSTANT, value=(255, 255, 255))
        top += pad_top; bottom += pad_top
        top -= pad_top
    im = im.astype(np.float32)
    H, W = im.shape[:2]
    if white_bg:
        u8 = im.astype(np.uint8)
        near = (u8.min(axis=2) > 225).astype(np.uint8)              # candidate background
        mask = np.zeros((H + 2, W + 2), np.uint8)
        bg = np.zeros((H, W), np.uint8)
        for seed in [(0, 0), (W - 1, 0), (0, H // 2), (W - 1, H // 2)]:
            x, y = seed
            if near[y, x]:
                tmp = near.copy() * 255
                cv2.floodFill(tmp, mask, (x, y), 128, loDiff=0, upDiff=0, flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
        bg = mask[1:-1, 1:-1] > 0
        # soft alpha in a thin band around the edge (anti-aliased fabric edges)
        L = im.mean(axis=2)
        band = cv2.dilate(bg.astype(np.uint8), np.ones((5, 5), np.uint8)) & (~bg).astype(np.uint8) | (bg & (cv2.erode(bg.astype(np.uint8), np.ones((3, 3), np.uint8)) == 0))
        alpha = np.where(bg, 0.0, 1.0).astype(np.float32)
        a_band = np.clip((255 - L) / 225.0, 0, 1)
        alpha = np.where(band > 0, a_band, alpha)
        alpha = np.where(bg & (band == 0), 0, alpha)
        alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8), iterations=2)   # pull the edge in ~2px: removes the light cut-out rim
        alpha = cv2.GaussianBlur(alpha, (0, 0), 1.0)
        # brand backdrop: charcoal with a soft warm glow behind the head
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W * .5) / (W * .75)) ** 2 + ((yy - (top + (bottom - top) * .32)) / (H * .45)) ** 2)
        base = np.array([12, 11, 10], np.float32)                     # BGR near-black
        edge = np.array([6, 6, 7], np.float32)
        back = base + (edge - base) * np.clip(r, 0, 1)[..., None]
        glow = np.clip(1 - r * 1.35, 0, 1)[..., None] ** 2
        back = back + glow * np.array([38, 62, 86], np.float32)      # gold-tinted light (BGR)
        # recover true foreground colour on edge pixels (remove white fringe)
        a3 = np.maximum(alpha, 1e-3)[..., None]
        fg = np.clip((im - (1 - a3) * 255) / a3, 0, 255)
        fg = np.where(alpha[..., None] > .98, im, fg)
        im = fg * alpha[..., None] + back * (1 - alpha[..., None])
    # crop 4:5 (pad never needed: width is kept)
    crop = im[top:bottom, :]
    ch, cw = crop.shape[:2]
    tw = int(round(ch * 4 / 5))
    if tw <= cw:
        x0 = (cw - tw) // 2; crop = crop[:, x0:x0 + tw]
    else:
        th = int(round(cw * 5 / 4)); crop = crop[:th]
    f = crop / 255.
    f = f + .045 * (f - .5) * (1 - np.abs(2 * f - 1))               # gentle contrast
    f[..., 2] *= 1.012; f[..., 0] *= .99                            # hint of warmth
    f = np.clip(f, 0, 1)
    img = cv2.resize(f, (720, 900), interpolation=cv2.INTER_AREA)
    blur = cv2.GaussianBlur(img, (0, 0), .8); img = np.clip(img * 1.25 - blur * .25, 0, 1)   # light sharpening
    pil = Image.fromarray((img[..., ::-1] * 255 + .5).astype(np.uint8))
    pil.save(out + '.webp', 'WEBP', quality=84, method=6); pil.save(out + '-preview.png')
    print('ok', out)

if __name__ == '__main__':
    pad = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--pad-top=')), 0)
    portrait(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), '--keep-bg' not in sys.argv, pad)
