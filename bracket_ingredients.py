"""
Transform ingredient lines in .nt recipe files by wrapping each ingredient
(including quantity) in square brackets.

Rules:
1. Only processes lines within `Ingredience:` sections
2. Splits comma-separated items (unless before tj./resp./popř. or the next
   part starts with `cca ` or digits — meaning it's a quantity spec for
   the same ingredient)
3. For each part, wraps before: ( nebo či prep-participle+na celý/celá/celé
   em-dash imperative-verbs
4. Otherwise wraps the whole content
"""

import re
import sys


# ---------------------------------------------------------------------------
# Finding the bracket end-position within a single ingredient token
# ---------------------------------------------------------------------------

PREP_PARTICIPLE = (
    r'nakrájen[aáéý]|rozkrájen[aáéý]|nastrouhan[aáéý]|nasekan[aáéý]|'
    r'nastrúhan[aáéý]|umyt[aáéý]|oloupan[aáéý]|rozmixovan[aáéý]|'
    r'přecezen[aáéý]|nadroben[aáéý]|uvařen[aáéý]|upečen[aáéý]|'
    r'orestovan[aáéý]|osmahnut[aáéý]|propláchnut[aáéý]|prolisovan[aáéý]|'
    r'nakrájenou|nastrouhan[eé]|nasekan[eé]'
)

PREP_ADVERB = r'najemno|nahrubo|nadrobno'

IMPERATIVE_VERBS = (
    r'nastrouhej|oloupej|nakrájej|rozkrájej|nasekej|rozmíchej'
)


def find_bracket_end(text: str) -> int:
    """Return the index where the ingredient name/quantity ends."""
    candidates: list[int] = []

    # --- parenthetical note: wrap before ' (' ---------------------------
    m = re.search(r'\s*\(', text)
    if m and m.start() > 0:
        candidates.append(m.start())

    # --- "nebo" alternative ---------------------------------------------
    m = re.search(r'\s+nebo\s', text)
    if m:
        candidates.append(m.start())

    # --- "či" alternative -----------------------------------------------
    m = re.search(r'\s+či\s', text)
    if m:
        candidates.append(m.start())

    # --- prep-participle followed by na/do/adverb -----------------------
    pattern = (
        r'\s+(' + PREP_PARTICIPLE + r')'
        r'\s+(?:na\b|do\b|' + PREP_ADVERB + r')'
    )
    m = re.search(pattern, text, re.IGNORECASE)
    if m and m.start() > 0:
        candidates.append(m.start())

    # --- standalone celý/celá/celé at end or before ( ------------------
    m = re.search(r'\s+(cel[áýé])\s*($|\()', text)
    if m and m.start() > 0:
        candidates.append(m.start())

    # --- em-dash ( – or — ) --------------------------------------------
    m = re.search(r'\s+[–—]\s+', text)
    if m and m.start() > 0:
        candidates.append(m.start())

    # --- regular hyphen-dash followed by 2+ uppercase letters (warning) -
    m = re.search(r'\s+-\s+[A-ZÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ]{2,}', text)
    if m and m.start() > 0:
        candidates.append(m.start())

    # --- imperative verbs embedded as prep instructions -----------------
    m = re.search(r'\s+(' + IMPERATIVE_VERBS + r')\b', text, re.IGNORECASE)
    if m and m.start() > 0:
        candidates.append(m.start())

    # --- prep adverbs (najemno / nahrubo) that appear AFTER content -----
    m = re.search(r'\s+(' + PREP_ADVERB + r')\b', text)
    if m and m.start() > 0:
        candidates.append(m.start())

    return min(candidates) if candidates else len(text)


# ---------------------------------------------------------------------------
# Splitting a line at commas that are outside parentheses
# ---------------------------------------------------------------------------

def split_outside_parens(text: str) -> list[str]:
    """Split text at commas that are outside parentheses.

    Does NOT split when the next token:
      - starts with a digit / ½ / ¼ / ¾ (quantity suffix like ", 5 kuliček")
      - starts with 'cca '
      - starts with abbreviations: tj., resp., popř., event.
    """
    parts: list[str] = []
    depth = 0
    current: list[str] = []
    i = 0
    n = len(text)

    while i < n:
        ch = text[i]
        if ch == '(':
            depth += 1
            current.append(ch)
        elif ch == ')':
            depth -= 1
            current.append(ch)
        elif ch == ',' and depth == 0:
            lookahead = text[i + 1:].lstrip()
            # Don't split if the next part is a quantity suffix
            if (
                lookahead.startswith(('tj.', 'resp.', 'popř.', 'event.'))
                or re.match(r'[\d½¼¾]', lookahead)
                or lookahead.startswith('cca ')
            ):
                current.append(ch)
            else:
                parts.append(''.join(current).strip())
                current = []
        else:
            current.append(ch)
        i += 1

    if current:
        parts.append(''.join(current).strip())

    return [p for p in parts if p]


# ---------------------------------------------------------------------------
# Transforming a single ingredient token
# ---------------------------------------------------------------------------

def transform_single_part(text: str) -> str:
    text = text.strip()
    if not text:
        return text
    # Already has brackets — leave alone
    if '[' in text:
        return text

    end = find_bracket_end(text)
    main = text[:end].strip()
    rest = text[end:].strip()

    if rest:
        return f'[{main}] {rest}'
    return f'[{main}]'


# ---------------------------------------------------------------------------
# Transforming a full ingredient line  "          - some text"
# ---------------------------------------------------------------------------

def transform_ingredient_line(line: str) -> str:
    m = re.match(r'^(\s*-\s)(.*)', line, re.DOTALL)
    if not m:
        return line

    prefix = m.group(1)
    content = m.group(2)

    # Leave empty or already-bracketed lines alone
    if not content.strip() or '[' in content:
        return line

    parts = split_outside_parens(content)

    if len(parts) > 1:
        transformed = [transform_single_part(p) for p in parts]
        return prefix + ', '.join(transformed)
    else:
        return prefix + transform_single_part(content)


# ---------------------------------------------------------------------------
# Processing a whole file
# ---------------------------------------------------------------------------

def process_file(content: str) -> str:
    lines = content.split('\n')
    result: list[str] = []
    in_ingredient = False
    item_indent: int | None = None

    for line in lines:
        stripped = line.strip()

        # Detect "        Ingredience:" key (at any indent level)
        m = re.match(r'^(\s+)Ingredience:\s*$', line)
        if m:
            in_ingredient = True
            item_indent = len(m.group(1)) + 2   # expected indent of list items
            result.append(line)
            continue

        if in_ingredient:
            if not stripped:
                # Blank line — stay in section (could be spacing between items)
                result.append(line)
                continue

            if stripped == '[]':
                # Empty list marker
                result.append(line)
                in_ingredient = False
                continue

            current_indent = len(line) - len(line.lstrip())

            if current_indent == item_indent and stripped.startswith('- '):
                result.append(transform_ingredient_line(line))
                continue

            # Something at a different indent or a new key — exit section
            in_ingredient = False

        result.append(line)

    return '\n'.join(result)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    for filepath in sys.argv[1:]:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = process_file(content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f'Processed: {filepath}')


if __name__ == '__main__':
    main()
