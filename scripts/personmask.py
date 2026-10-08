"""Cut the speaker out of a frame range (Apple Vision person segmentation) → transparent foreground clip.
Used to put text BEHIND the person (like Final Cut's Magnetic Mask).

Usage: .venv/bin/python scripts/personmask.py <video> <out.webm> <startFrame> <frames>
"""
import os
import subprocess
import sys
import tempfile

import Quartz
import Vision
from Foundation import NSURL

ONE_COMPONENT_8 = 1278226488  # kCVPixelFormatType_OneComponent8


def mask_frame(src_png, out_png, ctx):
    req = Vision.VNGeneratePersonSegmentationRequest.alloc().initWithCompletionHandler_(None)
    req.setQualityLevel_(Vision.VNGeneratePersonSegmentationRequestQualityLevelAccurate)
    req.setOutputPixelFormat_(ONE_COMPONENT_8)
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(src_png), None)
    handler.performRequests_error_([req], None)
    results = req.results() or []
    if not results:
        return False
    ci = Quartz.CIImage.imageWithCVPixelBuffer_(results[0].pixelBuffer())
    ctx.writePNGRepresentationOfImage_toURL_format_colorSpace_options_error_(
        ci, NSURL.fileURLWithPath_(out_png), Quartz.kCIFormatL8, Quartz.CGColorSpaceCreateDeviceGray(), None, None
    )
    return True


def main():
    video, out, start, frames = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    ffmpeg = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")
    ctx = Quartz.CIContext.contextWithOptions_(None)
    with tempfile.TemporaryDirectory() as tmp:
        os.makedirs(f"{tmp}/rgb"); os.makedirs(f"{tmp}/mask")
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-i", video, "-vf", f"select='between(n,{start},{start + frames - 1})'", "-vsync", "0", f"{tmp}/rgb/%05d.png"], check=True)
        names = sorted(os.listdir(f"{tmp}/rgb"))
        for n in names:
            mask_frame(f"{tmp}/rgb/{n}", f"{tmp}/mask/{n}", ctx)
        # soften the matte edge slightly, scale to frame size, merge as alpha
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-framerate", "30", "-i", f"{tmp}/rgb/%05d.png",
            "-framerate", "30", "-i", f"{tmp}/mask/%05d.png",
            "-filter_complex", "[1]scale=1080:1920,format=gray,gblur=sigma=1.5[m];[0]format=yuva420p[c];[c][m]alphamerge,format=yuva420p",
            "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", out,
        ], check=True)
    print(f"  person cut-out: {len(names)} frames → {out}")


if __name__ == "__main__":
    main()
