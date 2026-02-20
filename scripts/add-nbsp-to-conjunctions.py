#!/usr/bin/env python3
"""
Add Non-Breaking Spaces Before Conjunctions and Linking Words
=============================================================

This script scans HTML content (specifically article elements) and adds
non-breaking spaces (&nbsp;) before common conjunctions and linking words.

This creates strict typographic design where key connective words don't
break away from their preceding elements during text wrapping.

Usage:
    python3 add-nbsp-to-conjunctions.py <input_file> [output_file]

If no output_file is specified, the input file will be overwritten.

Words processed:
    and, or, but, yet, so, as, if, when, where, while, which, that,
    in, on, to, with, from, into, at

Example:
    python3 add-nbsp-to-conjunctions.py index.html
    python3 add-nbsp-to-conjunctions.py index.html output.html
"""

import re
import sys

def add_nbsp_to_conjunctions(content):
    """
    Add non-breaking spaces before conjunctions in article content.

    Args:
        content (str): HTML content to process

    Returns:
        str: Modified HTML content with &nbsp; before conjunctions
    """

    # List of conjunctions and linking words that should have non-breaking space before them
    words = [
        r'\band\b',
        r'\bor\b',
        r'\bbut\b',
        r'\byet\b',
        r'\bso\b',
        r'\bas\b',
        r'\bif\b',
        r'\bwhen\b',
        r'\bwhere\b',
        r'\bwhile\b',
        r'\bwhich\b',
        r'\bthat\b',
        r'\bin\b',
        r'\bon\b',
        r'\bto\b',
        r'\bwith\b',
        r'\bfrom\b',
        r'\binto\b',
        r'\bat\b',
    ]

    # Only apply within article content (preserves structure)
    article_pattern = r'(<article[^>]*>.*?</article>)'
    articles = re.findall(article_pattern, content, re.DOTALL)

    for article in articles:
        modified_article = article
        for word in words:
            # Replace space + word with non-breaking space + word
            # Avoids replacing at start of strings, case-insensitive
            modified_article = re.sub(
                r' (' + word + r')(?=[\s,.]|$)',
                r'&nbsp;\1',
                modified_article,
                flags=re.IGNORECASE
            )
        # Replace the original with modified in content
        content = content.replace(article, modified_article)

    return content


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file

    # Read input
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)

    # Process
    modified_content = add_nbsp_to_conjunctions(content)

    # Write output
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(modified_content)
        print(f"✓ Processed '{input_file}'")
        if output_file != input_file:
            print(f"✓ Output saved to '{output_file}'")
        else:
            print(f"✓ File updated in place")
    except IOError as e:
        print(f"Error writing to '{output_file}': {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
