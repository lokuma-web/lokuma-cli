#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lokuma Design — Cloud Client

Just describe what you're building. Lokuma figures out the rest.

Usage:
  python design.py "<describe your product or design need>"
  python design.py "<describe your product or design need>" -p "Project Name"
  python design.py "<describe your product or design need>" -f json
  python design.py "<describe your product or design need>" -f markdown

Examples:
  python design.py "A meditation app for stressed professionals. Calm, premium, organic."
  python design.py "A landing page for an AI sales SaaS. Sharp, fast, conversion-focused." -p "Closer"
  python design.py "What color palette fits a luxury skincare brand?" -f json
  python design.py "Best font pairing for a fintech dashboard" -f markdown

Setup:
  export LOKUMA_API_KEY=lokuma_your_key_here
  Get your key at https://agent.lokuma.ai
"""

import argparse
import json
import os
import sys
import io
import time
import socket
import random
import urllib.request
import urllib.error
from typing import Optional

# Force UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")


# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────

API_BASE = os.environ.get("LOKUMA_API_URL", "https://api.lokuma.ai").rstrip("/")
_BASE = API_BASE


def _get_api_key() -> str:
    # 1. Try ~/.lokuma/config.json first
    config_path = os.path.expanduser("~/.lokuma/config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                config = json.loads(f.read())
                key = config.get("apiKey", "").strip()
                if key:
                    return key
        except Exception:
            pass

    # 2. Fallback to environment variable
    key = os.environ.get("LOKUMA_API_KEY", "").strip()
    if not key:
        print(
            "Error: LOKUMA_API_KEY is not set.\n"
            "Run:  lokuma auth login\n"
            "Or:   export LOKUMA_API_KEY=lokuma_your_key_here\n"
            "Get your key at https://agent.lokuma.ai",
            file=sys.stderr,
        )
        sys.exit(1)
    return key


# ─────────────────────────────────────────────
# HTTP client (stdlib only, zero deps)
# ─────────────────────────────────────────────

def _post(endpoint: str, payload: dict) -> dict:
    api_key = _get_api_key()
    url = f"{_BASE}/{endpoint}"
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
            "User-Agent": "lokuma-skill/2.0",
            "Connection": "close",  # avoid keep-alive RST on long responses
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            # Read in chunks to avoid RST on long-running responses (>60s)
            chunks = []
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                chunks.append(chunk)
            body = b"".join(chunks).decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            err = json.loads(body)
            msg = err.get("error", body)
        except Exception:
            msg = body
        if e.code in (401, 403):
            print(f"Error: Invalid or expired API key (HTTP {e.code})", file=sys.stderr)
        elif e.code == 402:
            print(f"Error: {msg}", file=sys.stderr)
        else:
            print(f"Error: API returned HTTP {e.code}: {msg}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Error: Could not reach Lokuma API: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON response: {e}", file=sys.stderr)
        sys.exit(1)


# ─────────────────────────────────────────────
# Image reminder (appended to every recommendation)
# ─────────────────────────────────────────────

IMAGE_REMINDER = (
    "\n\n---\n"
    "> **Image requirement:** Always include real images when generating UI. "
    "Use high-quality placeholder sources such as Unsplash (`https://source.unsplash.com/...`) "
    "or Picsum (`https://picsum.photos/...`). "
    "Every hero section, card, and media slot must have an actual `<img>` tag or CSS background image. "
    "Do not leave image areas empty, use placeholder boxes, or skip images entirely."
)


# ─────────────────────────────────────────────
# Output formatting
# ─────────────────────────────────────────────

def _format_output(result: dict, fmt: str) -> str:
    if "error" in result:
        return f"Error: {result['error']}"

    # ── Print low-balance warning if present ──────────────────────────────────
    warning = result.get("warning")
    if warning:
        print(f"\n⚠️  {warning}\n", file=sys.stderr)

    # ── Design response: domains + recommendation ─────────────────────
    # V2 (2026-05-21): server now renders a complete self-contained markdown
    # brief. Client just returns recommendation directly — no Domain Matches
    # prepend (anti-leak), no IMAGE_REMINDER (server handles it).
    if "recommendation" in result:
        if fmt == "json":
            return json.dumps(result, indent=2, ensure_ascii=False)
        return result["recommendation"]

    # ── Legacy: design-system response (has "output" key) ────────────────────
    if "output" in result:
        return result["output"] + IMAGE_REMINDER

    # ── Legacy: design-system json response ──────────────────────────────────
    if "design_system" in result:
        ds = result["design_system"]
        if fmt == "json":
            return json.dumps(ds, indent=2, ensure_ascii=False)
        lines = [f"## Design System: {ds.get('project_name', '')}\n"]
        for section, data in ds.items():
            if section == "project_name":
                continue
            lines.append(f"### {section.replace('_', ' ').title()}")
            if isinstance(data, dict):
                for k, v in data.items():
                    lines.append(f"- **{k}**: {v}")
            else:
                lines.append(str(data))
            lines.append("")
        return "\n".join(lines) + IMAGE_REMINDER

    # ── Legacy: multi-domain response ────────────────────────────────────────
    if result.get("strategy") == "multi":
        if fmt == "json":
            return json.dumps(result, indent=2, ensure_ascii=False)
        lines = ["## Lokuma Design Results\n"]
        for r in result.get("results", []):
            domain = r.get("domain", "")
            lines.append(f"### {domain.title()}")
            for i, row in enumerate(r.get("results", []), 1):
                lines.append(f"**{i}.** " + " | ".join(
                    f"{k}: {str(v)[:100]}" for k, v in list(row.items())[:4]
                ))
            lines.append("")
        return "\n".join(lines) + IMAGE_REMINDER

    # ── Legacy: single-domain response ───────────────────────────────────────
    if fmt == "json":
        return json.dumps(result, indent=2, ensure_ascii=False)

    lines = [f"## Lokuma — {result.get('domain', '').title()}\n"]
    lines.append(f"**Query:** {result.get('query', '')}\n")
    for i, row in enumerate(result.get("results", []), 1):
        lines.append(f"### Result {i}")
        for key, value in row.items():
            v = str(value)
            if len(v) > 300:
                v = v[:300] + "..."
            lines.append(f"- **{key}:** {v}")
        lines.append("")
    return "\n".join(lines) + IMAGE_REMINDER


# ─────────────────────────────────────────────
# Retry configuration (rate-limit resilience)
# ─────────────────────────────────────────────

_MAX_RETRIES = int(os.environ.get("LOKUMA_MAX_RETRIES", "3"))
_BASE_RETRY_DELAY = float(os.environ.get("LOKUMA_RETRY_DELAY", "2.0"))


def _retry_sleep(attempt: int, reason: str = ""):
    delay = min(_BASE_RETRY_DELAY * (2 ** attempt), 30.0)
    jitter = delay * 0.3 * random.random()
    wait = delay + jitter
    label = f" ({reason})" if reason else ""
    print(f"  ⏳ Retrying in {wait:.1f}s... (attempt {attempt + 1}/{_MAX_RETRIES}){label}", file=sys.stderr)
    time.sleep(wait)


# ─────────────────────────────────────────────
# SSE streaming client
# ─────────────────────────────────────────────

_DOMAIN_LABELS = {
    "style":        "Visual Style",
    "color":        "Color Palette",
    "typography":   "Typography",
    "product":      "Product Type",
    "reasoning":    "Design Reasoning",
    "ux":           "UX Guidelines",
    "chart":        "Charts",
    "landing":      "Landing Pattern",
    "icons":        "Icon Library",
    "google-fonts": "Google Fonts",
}


def _post_stream(endpoint: str, payload: dict) -> dict:
    """
    POST to a streaming SSE endpoint with exponential backoff retry.
    Prints progress as events arrive, returns the final 'done' payload.
    Handles rate limits (429), timeouts, and connection errors gracefully.
    """
    api_key = _get_api_key()
    url = f"{_BASE}/{endpoint}"
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    last_error = None

    for attempt in range(_MAX_RETRIES + 1):
        if attempt > 0:
            _retry_sleep(attempt - 1)

        try:
            req = urllib.request.Request(
                url,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": api_key,
                    "User-Agent": "lokuma-skill/2.1",
                    "Accept": "text/event-stream",
                    "Connection": "close",
                },
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=120) as resp:
                content_type = resp.headers.get("Content-Type", "")
                if "text/event-stream" not in content_type:
                    body = resp.read().decode("utf-8")
                    return json.loads(body)

                result = {}
                total = 0
                done_count = 0

                print("", file=sys.stderr)

                for raw_line in resp:
                    line = raw_line.decode("utf-8", errors="replace").rstrip("\n\r")

                    if not line.startswith("data:"):
                        continue

                    json_str = line[len("data:"):].strip()
                    if not json_str:
                        continue

                    try:
                        event = json.loads(json_str)
                    except json.JSONDecodeError:
                        continue

                    kind = event.get("event")

                    if kind == "start":
                        total = event.get("total", 10)
                        name = event.get("project_name", "")
                        print(f"  ⟳ Analyzing: {name}", file=sys.stderr)

                    elif kind == "domain_done":
                        done_count += 1
                        domain = event.get("domain", "")
                        match_val = event.get("match", "")
                        label = _DOMAIN_LABELS.get(domain, domain.title())
                        bar = "█" * done_count + "░" * (total - done_count)
                        print(f"  [{bar}] {label}: {match_val}", file=sys.stderr)

                    elif kind == "synthesizing":
                        print("\n  ✦ Synthesizing design recommendation...", file=sys.stderr)

                    elif kind == "done":
                        result = event
                        warning = result.get("warning")
                        if warning:
                            print(f"\n⚠️  {warning}", file=sys.stderr)
                        print("", file=sys.stderr)
                        return result

                    elif kind == "error":
                        error_msg = event.get("message", "Unknown error")
                        print(f"\n  ✗ Error: {error_msg}", file=sys.stderr)
                        return {"error": error_msg}

                return result

        except urllib.error.HTTPError as e:
            if e.code == 429:
                retry_after = e.headers.get("Retry-After", "")
                if retry_after.isdigit():
                    wait = int(retry_after)
                    print(f"  ⚠ Rate limited (HTTP 429), server says wait {wait}s", file=sys.stderr)
                    if attempt < _MAX_RETRIES:
                        time.sleep(wait)
                        continue
                elif attempt < _MAX_RETRIES:
                    print("  ⚠ Rate limited (HTTP 429)", file=sys.stderr)
                    continue
            elif e.code in (401, 403):
                body = e.read().decode("utf-8", errors="replace")
                try:
                    err = json.loads(body)
                    msg = err.get("error", body)
                except Exception:
                    msg = body
                print(f"Error: Invalid or expired API key (HTTP {e.code}): {msg}", file=sys.stderr)
                sys.exit(1)
            elif e.code == 402:
                body = e.read().decode("utf-8", errors="replace")
                try:
                    err = json.loads(body)
                    msg = err.get("error", body)
                except Exception:
                    msg = body
                print(f"Error: {msg}", file=sys.stderr)
                sys.exit(1)
            elif e.code >= 500 and attempt < _MAX_RETRIES:
                print(f"  ⚠ Server error (HTTP {e.code}), retrying...", file=sys.stderr)
                last_error = e
                continue
            elif attempt < _MAX_RETRIES:
                body = e.read().decode("utf-8", errors="replace")
                print(f"  ⚠ HTTP {e.code}, retrying...", file=sys.stderr)
                last_error = e
                continue
            else:
                body = e.read().decode("utf-8", errors="replace")
                try:
                    err = json.loads(body)
                    msg = err.get("error", body)
                except Exception:
                    msg = body
                print(f"Error: API returned HTTP {e.code}: {msg}", file=sys.stderr)
                sys.exit(1)

        except (socket.timeout, TimeoutError, ConnectionError) as e:
            if attempt < _MAX_RETRIES:
                print(f"  ⚠ Connection timed out, retrying...", file=sys.stderr)
                last_error = e
                continue
            last_error = e

        except urllib.error.URLError as e:
            reason = str(e.reason).lower()
            if attempt < _MAX_RETRIES and any(kw in reason for kw in ("timeout", "reset", "refused", "unreachable")):
                print(f"  ⚠ Connection issue ({e.reason}), retrying...", file=sys.stderr)
                last_error = e
                continue
            last_error = e

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error: Invalid JSON response: {e}", file=sys.stderr)
            sys.exit(1)

        except Exception as e:
            if attempt < _MAX_RETRIES:
                print(f"  ⚠ Unexpected error ({e}), retrying...", file=sys.stderr)
                last_error = e
                continue
            last_error = e

    if last_error:
        if isinstance(last_error, urllib.error.HTTPError):
            print(f"Error: API returned HTTP {last_error.code} after {_MAX_RETRIES} retries", file=sys.stderr)
        else:
            print(f"Error: Could not reach Lokuma API after {_MAX_RETRIES} retries: {last_error}", file=sys.stderr)
    else:
        print(f"Error: Request failed after {_MAX_RETRIES} retries", file=sys.stderr)
    sys.exit(1)


# ─────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Lokuma Design Intelligence",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("query", help="Describe your product or design need in natural language")
    parser.add_argument("--project-name", "-p", type=str, default=None,
                        help="Optional project name")
    parser.add_argument("--format", "-f", choices=["ascii", "markdown", "json"],
                        default="ascii", help="Output format (default: ascii)")

    args = parser.parse_args()

    payload = {"query": args.query, "format": args.format}
    if args.project_name:
        payload["project_name"] = args.project_name

    result = _post_stream("design/stream", payload)
    print(_format_output(result, args.format))


if __name__ == "__main__":
    main()
