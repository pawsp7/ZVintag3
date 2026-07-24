#!/usr/bin/env python3
"""Fetch products from the ZVINTAG3 eBay store with correct image-to-listing mapping."""

import json
import re
import subprocess
import sys
import time
from pathlib import Path

STORE_URL = "https://www.ebay.ca/str/zvintag3"
OUTPUT = Path(__file__).resolve().parent.parent / "assets" / "products.json"
MAX_PAGES = 25
PAGE_DELAY_SECONDS = 0.5


def categorize(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ("tee", "t-shirt", "ringer")):
        return "retro-tees"
    if any(w in t for w in ("jeans", "denim", "levi")):
        return "denim"
    if any(w in t for w in ("bag", "satchel", "hat", "cap", "duffle", "driver", "golf", "pad")):
        return "accessories"
    if "vintage" in t:
        return "vintage-clothing"
    return "streetwear"


def decode_title(raw: str) -> str:
    try:
        return json.loads(f'"{raw}"')
    except json.JSONDecodeError:
        return raw.replace('\\"', '"').replace("\\'", "'")


def fetch_store_html(page: int = 1) -> str:
    url = STORE_URL if page == 1 else f"{STORE_URL}?_pgn={page}"
    result = subprocess.run(
        [
            "curl", "-sL", "-A",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "--max-time", "30", url,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def extract_price(listing_id: str, chunk: str) -> str | None:
    for listing_match in re.finditer(rf'"listingId":"{listing_id}"', chunk):
        local = chunk[listing_match.start():listing_match.start() + 2500]
        price_match = re.search(
            r'"displayPrice":\{"_type":"TextualDisplayValue".*?"text":"(C \$[^"]+)"',
            local,
            re.DOTALL,
        )
        if price_match:
            return price_match.group(1).replace("C $", "C$")
    return None


def parse_products(html: str) -> list[dict]:
    items = []
    pattern = re.compile(
        r'"URL":"https://www\.ebay\.ca/itm/(\d+)\?[^"]*hash=item[^:]*:g:([^"\\]+)"'
    )

    for match in pattern.finditer(html):
        listing_id, image_id = match.group(1), match.group(2)
        start = max(0, match.start() - 4000)
        end = min(len(html), match.end() + 4000)
        chunk = html[start:end]

        title = None
        for listing_match in re.finditer(rf'"listingId":"{listing_id}"', chunk):
            local = chunk[max(0, listing_match.start() - 500):listing_match.start() + 1500]
            title_match = re.search(r'"title":"((?:[^"\\]|\\.)*)"', local)
            if title_match:
                title = decode_title(title_match.group(1))
                break

        if not title:
            rel = match.start() - start
            titles = re.findall(r'"title":"((?:[^"\\]|\\.)*)"', chunk[:rel])
            if titles:
                title = decode_title(titles[-1])

        if not title or len(title) < 10:
            continue
        if title in ("Shop by category", "Filter by category"):
            continue

        item = {
            "title": title,
            "image": f"https://i.ebayimg.com/images/g/{image_id}/s-l500.jpg",
            "url": f"https://www.ebay.ca/itm/{listing_id}",
            "category": categorize(title),
        }
        price = extract_price(listing_id, chunk)
        if price:
            item["price"] = price
        items.append(item)

    return items


def fetch_all_products() -> list[dict]:
    seen: dict[str, dict] = {}

    for page in range(1, MAX_PAGES + 1):
        html = fetch_store_html(page)
        page_items = parse_products(html)
        new_count = 0

        for item in page_items:
            if item["url"] not in seen:
                seen[item["url"]] = item
                new_count += 1

        print(f"Page {page}: {len(page_items)} listings, {new_count} new (total {len(seen)})", file=sys.stderr)

        if new_count == 0:
            break

        if page < MAX_PAGES:
            time.sleep(PAGE_DELAY_SECONDS)

    return list(seen.values())


def main() -> int:
    products = fetch_all_products()
    if not products:
        print("No products parsed from eBay store.", file=sys.stderr)
        return 1

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(products, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(products)} products to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
