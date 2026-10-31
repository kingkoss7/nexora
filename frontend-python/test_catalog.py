import base64
import unittest

from catalog import fallback_image_url, product_image_url


class ProductImageTest(unittest.TestCase):
    def test_known_product_uses_its_matching_photo(self):
        self.assertEqual(
            product_image_url({"pid": 1, "category": "electronics"}),
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=85",
        )

    def test_unknown_product_uses_category_photo(self):
        self.assertEqual(
            product_image_url({"pid": 99, "category": "fashion"}),
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85",
        )

    def test_unknown_category_uses_embedded_placeholder(self):
        self.assertEqual(product_image_url({"pid": 99, "category": "other"}), fallback_image_url())
        self.assertTrue(fallback_image_url().startswith("data:image/svg+xml;base64,"))

    def test_placeholder_uses_the_storefront_palette(self):
        svg = base64.b64decode(fallback_image_url().split(",", 1)[1])
        self.assertIn(b"#E8F2EF", svg)
        self.assertIn(b"#176B64", svg)


if __name__ == "__main__":
    unittest.main()
