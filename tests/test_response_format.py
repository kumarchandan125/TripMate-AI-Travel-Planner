import unittest

from backend import normalize_message_content


class ResponseFormatTests(unittest.TestCase):
    def test_normalizes_text_blocks(self):
        content = [
            {"type": "text", "text": "Trip summary"},
            {"type": "text", "text": "Day 1: Arrival"},
        ]

        self.assertEqual(
            normalize_message_content(content),
            "Trip summary\nDay 1: Arrival",
        )

    def test_normalizes_nested_content_dict(self):
        content = {"content": [{"type": "text", "text": "Flight details"}]}

        self.assertEqual(normalize_message_content(content), "Flight details")


if __name__ == "__main__":
    unittest.main()
