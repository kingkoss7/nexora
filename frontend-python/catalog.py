import base64
from collections.abc import Mapping


PRODUCT_PHOTOS = {
    1: "photo-1496181133206-80ce9b88a853",
    2: "photo-1505740420928-5e560c06d30e",
    3: "photo-1587829741301-dc798b83add3",
    4: "photo-1542291026-7eec264c27ff",
    5: "photo-1551028719-00167b16eac5",
    6: "photo-1495474472287-4d71bcdd2085",
    7: "photo-1507473885765-e6ed057f782c",
    8: "photo-1553062407-98eeb64c6a62",
    9: "photo-1523275335684-37898b6baf30",
    10: "photo-1523170335258-f5ed11844a49",
    11: "photo-1511707171634-5f897ff02aa9",
    12: "photo-1544244015-0df4b3ffc6b0",
    13: "photo-1516035069371-29a1b244cc32",
    14: "photo-1608043152269-423dbba4e7e1",
    15: "photo-1606220945770-b5b6c2c55bf1",
    16: "photo-1609091839311-d5365f9ff1c5",
    17: "photo-1583863788434-e58a36330cf0",
}

CATEGORY_PHOTOS = {
    "electronics": "photo-1496181133206-80ce9b88a853",
    "fashion": "photo-1553062407-98eeb64c6a62",
    "home": "photo-1495474472287-4d71bcdd2085",
    "accessories": "photo-1523170335258-f5ed11844a49",
}

_FALLBACK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<rect width="800" height="600" fill="#E8F2EF"/>
<circle cx="400" cy="276" r="82" fill="none" stroke="#176B64" stroke-width="8" opacity=".7"/>
<path d="M350 276h100M400 226v100" stroke="#176B64" stroke-width="8" opacity=".7"/>
<text x="400" y="430" fill="#687773" font-family="Arial,sans-serif" font-size="24"
text-anchor="middle" letter-spacing="6">NEXORA</text></svg>"""
_FALLBACK_IMAGE = "data:image/svg+xml;base64," + base64.b64encode(
    _FALLBACK_SVG.encode("utf-8")
).decode("ascii")


def fallback_image_url() -> str:
    return _FALLBACK_IMAGE


def product_image_url(product: Mapping[str, object]) -> str:
    try:
        product_id = int(product.get("pid", 0))
    except (TypeError, ValueError):
        product_id = 0
    category = str(product.get("category", "")).strip().lower()
    photo = PRODUCT_PHOTOS.get(product_id) or CATEGORY_PHOTOS.get(category)
    if not photo:
        return fallback_image_url()
    return f"https://images.unsplash.com/{photo}?auto=format&fit=crop&w=1000&q=85"
