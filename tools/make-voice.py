# Records every line the game can say as a natural-sounding voice clip, using the open-weight Kokoro-82M
# speech model (Apache-2.0), so the game can play real audio instead of the device's robotic voice.
# A clip's name is a hash of its text, voice and speed, so a rerun only records lines that are new or changed;
# delete a clip to record it again. The browser looks each line up by its exact text in manifest.json.
#
# Setup, once (Python 3.10 to 3.12; the first run also downloads the ~330 MB model from Hugging Face):
#   python3 -m venv ~/.venvs/voice && . ~/.venvs/voice/bin/activate
#   pip install -r tools/voice-requirements.txt
#
# Usage:
#   node tools/voice-lines.mjs > lines.json
#   python tools/make-voice.py lines.json voice [--voice af_heart] [--speed 0.9] [--prune]
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import warnings
from pathlib import Path

ENGINE = "Kokoro-82M"
RATE = 24000
MS = RATE // 1000  # samples per millisecond
BITRATE = "48k"
LOUDNESS_DB = -20  # speech level of every clip
PEAK_DB = -1  # no sample goes louder than this
SETUP = "pip install -r tools/voice-requirements.txt"
# Words Kokoro says wrong, spelled in its own phonemes (misaki's US set: A = the "ay" in day, I = eye,
# O = oh, T = a soft "d"-like t, ᵻ = a light "i"). Find how a word is said with misaki's G2P, then add it here.
SAY_AS = {
    "rattail": "ɹˈæt tˌAl", "rattails": "ɹˈæt tˌAlz",  # "rat tail", not "RADD-ale"
    "narwhal": "nˈɑɹwˌɑl", "narwhals": "nˈɑɹwˌɑlz", "narwhal's": "nˈɑɹwˌɑlz",  # no "h" in the middle
    "amphipod": "ˈæmfəpˌɑd", "amphipods": "ˈæmfəpˌɑdz",  # no "p" before the f
    "axes": "ˈæksᵻz",  # more than one axe, not more than one axis
    "man o' war": "mˌænəwˈɔɹ", "men o' war": "mˌɛnəwˈɔɹ",  # "man-uh-war", no pause
}
SAY_AS_WORDS = re.compile(r"(?<![A-Za-z])(" + "|".join(map(re.escape, sorted(SAY_AS, key=len, reverse=True))) +
                          r")(?![A-Za-z])", re.IGNORECASE)


def spoken(text):
    """The line as Kokoro should read it: each SAY_AS word marked with its phonemes, [word](/phonemes/)."""
    return SAY_AS_WORDS.sub(lambda match: f"[{match.group(0)}](/{SAY_AS[match.group(0).lower()]}/)", text)


def clip_id(text, voice, speed):
    return hashlib.sha1(f"{spoken(text)}\n{voice}\n{speed}".encode("utf-8")).hexdigest()[:12]


def voice_maker(voice, speed):
    """Loads Kokoro once and returns a function that records one line to an MP3 file."""
    warnings.filterwarnings("ignore")
    os.environ.setdefault("HF_HUB_VERBOSITY", "error")
    try:
        import imageio_ffmpeg
        import numpy as np
        from kokoro import KPipeline
    except ImportError as error:
        sys.exit(f"make-voice: {error.name} is not installed. Set up the voice engine first:\n  {SETUP}")
    if voice[:1] not in ("a", "b"):
        sys.exit(f"make-voice: {voice!r} is not an English Kokoro voice (try af_heart, af_bella, am_michael or bf_emma)")
    pipeline = KPipeline(lang_code=voice[0], repo_id="hexgrad/Kokoro-82M")
    try:
        pipeline.load_voice(voice)
    except Exception as error:
        sys.exit(f"make-voice: could not load voice {voice!r}: {error}")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    def make(text, path):
        parts = [result.audio.numpy() for result in pipeline(text, voice=voice, speed=speed) if result.audio is not None]
        if not parts:
            sys.exit(f"make-voice: Kokoro made no sound for {text!r}")
        audio = np.concatenate(parts)
        # Cut the model's long silent edges to 20 ms, then pad to 80 ms of quiet before and 150 ms after.
        loud = np.flatnonzero(np.abs(audio) > np.abs(audio).max() * 10 ** (-50 / 20))
        audio = audio[max(loud[0] - 20 * MS, 0):loud[-1] + 20 * MS]
        # Kokoro's loudness is steady but its peaks are not, so every clip is matched on the level of its speech
        # (20 ms frames within 30 dB of the loudest), and the odd peak that would pass PEAK_DB is turned down
        # on its own for a few milliseconds instead of turning the whole clip down.
        frame = 20 * MS
        frames = np.sqrt((audio[:len(audio) // frame * frame].reshape(-1, frame) ** 2).mean(axis=1))
        speech = frames[frames > frames.max() * 10 ** (-30 / 20)]
        audio = audio * 10 ** (LOUDNESS_DB / 20) / np.sqrt((speech ** 2).mean())
        room = np.minimum(1, 10 ** (PEAK_DB / 20) / np.maximum(np.abs(audio), 1e-9))
        room = np.lib.stride_tricks.sliding_window_view(np.pad(room, frame // 2, mode="edge"), frame + 1).min(axis=1)
        audio *= np.convolve(room, np.hanning(frame + 1) / np.hanning(frame + 1).sum(), mode="same")
        audio = np.concatenate([np.zeros(60 * MS), audio, np.zeros(130 * MS)])
        partial = path.with_suffix(".part")
        subprocess.run([ffmpeg, "-v", "error", "-y", "-f", "f32le", "-ar", str(RATE), "-ac", "1", "-i", "-",
                        "-c:a", "libmp3lame", "-b:a", BITRATE, "-id3v2_version", "0", "-f", "mp3", str(partial)],
                       input=audio.astype("<f4").tobytes(), check=True)
        partial.replace(path)
        return len(audio) / RATE

    return make


def main():
    parser = argparse.ArgumentParser(description="Record the game's spoken lines as MP3 clips with Kokoro-82M.")
    parser.add_argument("lines", help="JSON array of every line the game can say")
    parser.add_argument("out_dir", help="folder for the clips and manifest.json")
    parser.add_argument("--voice", default="af_heart", help="Kokoro voice (default af_heart)")
    parser.add_argument("--speed", type=float, default=0.9, help="speaking speed (default 0.9)")
    parser.add_argument("--prune", action="store_true", help="delete clips the new manifest no longer uses")
    args = parser.parse_args()

    lines = json.loads(Path(args.lines).read_text(encoding="utf-8"))
    if not isinstance(lines, list) or not all(isinstance(line, str) for line in lines):
        sys.exit(f"make-voice: {args.lines} must be a JSON array of strings")
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    clips = {text: clip_id(text, args.voice, args.speed) + ".mp3" for text in sorted(set(lines)) if text.strip()}

    make = None
    generated = reused = pruned = 0
    for text, name in clips.items():
        if (out / name).exists():
            reused += 1
            continue
        make = make or voice_maker(args.voice, args.speed)
        started = time.time()
        seconds = make(spoken(text), out / name)
        generated += 1
        print(f"{name}  {seconds:4.1f}s audio in {time.time() - started:4.1f}s  {text}", flush=True)

    manifest = {"voice": args.voice, "speed": args.speed, "engine": ENGINE, "clips": clips}
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if args.prune:
        used = set(clips.values())
        for path in out.glob("*.mp3"):
            if path.name not in used:
                path.unlink()
                pruned += 1
    total = sum((out / name).stat().st_size for name in clips.values())
    print(f"generated {generated}, reused {reused}, pruned {pruned}, total {total} bytes in {len(clips)} clips")


if __name__ == "__main__":
    main()
