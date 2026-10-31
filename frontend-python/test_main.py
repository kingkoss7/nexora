import os
import socket
import subprocess
import sys
import time
import unittest
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "frontend-python" / "main.py"


class StorefrontStartupTest(unittest.TestCase):
    def test_home_page_renders_successfully(self):
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]

        environment = os.environ.copy()
        environment["PORT"] = str(port)
        process = subprocess.Popen(
            [sys.executable, str(APP)],
            cwd=ROOT,
            env=environment,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            deadline = time.monotonic() + 25
            response = None
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    self.fail(f"Storefront exited with status {process.returncode}")
                try:
                    response = urlopen(f"http://127.0.0.1:{port}", timeout=15)
                    break
                except HTTPError as error:
                    response = error
                    break
                except URLError:
                    time.sleep(0.1)

            self.assertIsNotNone(response, "Storefront did not start before timeout")
            body = response.read()
            self.assertEqual(response.status, 200, body.decode(errors="replace"))
            self.assertIn(b"NEXORA E-Commerce", body)
            self.assertIn(b"#F5F6F3", body)
            self.assertIn(b"#176B64", body)
            self.assertNotIn(b"#100B1B", body)
            self.assertNotIn(b"#C3A0FF", body)
        finally:
            process.terminate()
            process.wait(timeout=5)


class StorefrontThemeTest(unittest.TestCase):
    def test_home_page_uses_modern_light_palette(self):
        stylesheet = APP.read_text(encoding="utf-8")
        self.assertIn("color-scheme:light", stylesheet)
        self.assertIn("--nx-bg:#F5F6F3", stylesheet)
        self.assertIn("--nx-accent:#176B64", stylesheet)
        self.assertIn(".q-btn.q-btn--unelevated.bg-primary", stylesheet)
        self.assertNotIn("#100B1B", stylesheet)
        self.assertNotIn("#C3A0FF", stylesheet)


if __name__ == "__main__":
    unittest.main()
