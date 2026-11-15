"""Team portrait: crop to 4:5, swap a plain white studio background for the MJR dark studio backdrop.
The person (face, clothing) is never altered beyond a gentle global tone curve."""
import sys, cv2, numpy as np
from PIL import Image

def portrait(src, out, top, bottom, white_bg=True, pad_top=0, blocks=(), hair_y=0, shrink=0, thr=228, band=9):
    im = cv2.imread(src)
    if pad_top:                                                     # more headroom: extend the plain backdrop upwards
        im = cv2.copyMakeBorder(im, pad_top, 0, 0, 0, cv2.BORDER_CONSTANT, value=(255, 255, 255))
        top += pad_top; bottom += pad_top
        top -= pad_top
    im = im.astype(np.float32)
    H, W = im.shape[:2]
    if white_bg:
        H, W = im.shape[:2]
        u8 = im.astype(np.uint8)
        B = np.array([255., 255., 255.], np.float32)
        near = (u8.min(axis=2) > thr).astype(np.uint8)              # backdrop-coloured pixels
        for (bx0, by0, bx1, by1) in blocks:                          # e.g. a white collar touching the backdrop
            near[by0 + pad_top:by1 + pad_top, bx0:bx1] = 0
        # 1) backdrop = everything white connected to the image border
        ff = np.zeros((H + 2, W + 2), np.uint8)
        for x, y in [(0, 0), (W - 1, 0), (0, H // 3), (W - 1, H // 3), (0, H // 2), (W - 1, H // 2), (W // 2, 0)]:
            if near[y, x]:
                cv2.floodFill(near.copy(), ff, (x, y), 1, loDiff=0, upDiff=0, flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
        bg = ff[1:-1, 1:-1] > 0
        fg0 = ~bg
        # 2) trimap: thin unknown band at edges, wider in the hair zone (flyaway strands)
        dist = cv2.distanceTransform(fg0.astype(np.uint8), cv2.DIST_L2, 3)
        yy = np.mgrid[0:H, 0:W][0]
        hz = (yy < hair_y + pad_top) if hair_y else np.zeros((H, W), bool)
        L = im.mean(axis=2)
        local = cv2.blur(L, (15, 15))
        sat = cv2.cvtColor(u8, cv2.COLOR_BGR2HSV)[..., 1]
        unknown = fg0 & (dist <= np.where(hz, 40, band))
        # light gaps trapped between hair strands: bright, grey, sitting in a dark (hair) neighbourhood — never skin
        unknown |= hz & fg0 & (L > 140) & (sat < 60) & (local < 150) & (dist < 70)
        unknown |= bg & (cv2.distanceTransform((~bg).astype(np.uint8), cv2.DIST_L2, 3) <= 2)
        deffg = fg0 & ~unknown
        # 3) local subject colour F from nearby certain-subject pixels
        wgt = deffg.astype(np.float32)
        F = np.zeros_like(im)
        acc_w = np.zeros((H, W), np.float32)
        for sig in (4, 10, 24):
            bw = cv2.GaussianBlur(wgt, (0, 0), sig)
            bc = cv2.GaussianBlur(im * wgt[..., None], (0, 0), sig)
            take = (acc_w < .02) & (bw > .02)
            F[take] = bc[take] / bw[take][..., None]
            acc_w = np.maximum(acc_w, bw)
        # 4) alpha against the known white backdrop:  I = a*F + (1-a)*B
        d = B - F
        den = (d * d).sum(axis=2)
        a_est = np.clip(((B - im) * d).sum(axis=2) / np.maximum(den, 1.0), 0, 1)
        a_est = np.where(den < 900, 1.0, a_est)                        # subject colour too close to white: keep solid
        alpha = np.where(deffg, 1.0, np.where(unknown, a_est, 0.0)).astype(np.float32)
        if shrink:                                                    # source already had a cut-out outline: trim it
            alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8), iterations=shrink)
            deffg = deffg & (alpha > .999)
        alpha = cv2.GaussianBlur(alpha, (0, 0), .5 + .3 * shrink)
        alpha = np.where(deffg, 1.0, alpha)
        # 5) clean subject colour on edge pixels (no white fringe)
        a3 = np.maximum(alpha, 1e-3)[..., None]
        fgc = np.clip((im - (1 - a3) * B) / a3, 0, 255)
        fgc = np.where(alpha[..., None] < .08, F, fgc)
        fgc = np.where(deffg[..., None], im, fgc)
        # 6) MJR studio backdrop: charcoal with a soft warm glow behind the head
        yyf, xxf = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xxf - W * .5) / (W * .75)) ** 2 + ((yyf - (top + (bottom - top) * .32)) / (H * .45)) ** 2)
        base = np.array([12, 11, 10], np.float32); edge = np.array([6, 6, 7], np.float32)
        back = base + (edge - base) * np.clip(r, 0, 1)[..., None]
        back = back + (np.clip(1 - r * 1.35, 0, 1)[..., None] ** 2) * np.array([38, 62, 86], np.float32)
        im = fgc * alpha[..., None] + back * (1 - alpha[..., None])
        cv2.imwrite(out + '-alpha.png', (alpha * 255).astype(np.uint8))
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
    blocks = [tuple(int(v) for v in a.split('=')[1].split(',')) for a in sys.argv if a.startswith('--block=')]
    hair = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--hair=')), 0)
    shrink = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--shrink=')), 0)
    thr = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--thr=')), 228)
    band = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--band=')), 9)
    portrait(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), '--keep-bg' not in sys.argv, pad, blocks, hair, shrink, thr, band)
