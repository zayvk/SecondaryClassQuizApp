# ============================================================
#  Cambridge Lower Secondary Grade 9 — Quiz Generator
#  Run: python generate.py
#  Reads topics.json → calls Gemini → saves question JSONs
#  Auto-retries on network errors/timeouts
# ============================================================

import json
import time
import sys
from pathlib import Path
from google import genai

# ─── CONFIG ─────────────────────────────────────────────────
from dotenv import load_dotenv
import os

load_dotenv()

# Config
GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY")
MODEL              = "gemma-3-27b-it"
QUESTIONS_PER_UNIT = 50
OUTPUT_DIR         = Path("../src/data")
TOPICS_FILE        = Path("./topics.json")
DELAY_SECONDS      = 3
MAX_RETRIES        = 5
RETRY_WAIT         = 30
# ────────────────────────────────────────────────────────────

# ─── DISPLAY HELPERS ────────────────────────────────────────

BAR_WIDTH = 30

def format_duration(seconds: float) -> str:
    if seconds < 60:
        return f"{seconds:.1f}s"
    m, s = divmod(int(seconds), 60)
    return f"{m}m {s:02d}s"

def progress_bar(current: int, total: int) -> str:
    pct      = current / total
    filled   = int(BAR_WIDTH * pct)
    empty    = BAR_WIDTH - filled
    bar      = "█" * filled + "░" * empty
    return f"[{bar}] {current}/{total} ({pct*100:.0f}%)"

def spinner_frame(frame: int) -> str:
    frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    return frames[frame % len(frames)]

def print_header():
    print("\n" + "═" * 55)
    print("  🎓 Cambridge Grade 9 Quiz Generator")
    print(f"  Model : {MODEL}")
    print(f"  Output: {OUTPUT_DIR}")
    print("═" * 55 + "\n")

def print_unit_start(unit_name: str, done: int, total: int):
    print(f"\n  {progress_bar(done, total)}")
    print(f"  ⏳ Starting : {unit_name}")

def print_live_timer(elapsed: float, attempt: int, frame: int):
    """Overwrite the same line with a live timer."""
    msg = f"  {spinner_frame(frame)}  Generating ... {format_duration(elapsed)}"
    if attempt > 1:
        msg += f"  (attempt {attempt})"
    sys.stdout.write(f"\r{msg}    ")
    sys.stdout.flush()

def print_unit_done(unit_name: str, q_count: int, elapsed: float):
    sys.stdout.write("\r" + " " * 60 + "\r")  # clear spinner line
    print(f"  ✅ Done     : {unit_name}")
    print(f"     Questions: {q_count}  |  Time: {format_duration(elapsed)}")

def print_unit_retry(attempt: int, wait: int, error_snippet: str):
    sys.stdout.write("\r" + " " * 60 + "\r")
    print(f"  ⚠️  Network error — retrying in {wait}s (attempt {attempt}/{MAX_RETRIES})")
    print(f"     {error_snippet[:80]}")

def print_unit_failed(unit_name: str, attempts: int):
    sys.stdout.write("\r" + " " * 60 + "\r")
    print(f"  ❌ Failed   : {unit_name} after {attempts} attempt(s)")

def print_unit_skipped(unit_name: str):
    print(f"  ⏭  Skipped  : {unit_name} (already exists)")

def print_summary(total: int, succeeded: int, failed_list: list, total_time: float):
    print("\n" + "═" * 55)
    print("  📊 Summary")
    print("═" * 55)
    print(f"  Total units  : {total}")
    print(f"  ✅ Succeeded : {succeeded}")
    print(f"  ❌ Failed    : {len(failed_list)}")
    print(f"  ⏱  Total time: {format_duration(total_time)}")
    if failed_list:
        print("\n  Failed units (run script again to retry):")
        for name in failed_list:
            print(f"    • {name}")
    else:
        print("\n  🏆 All units generated successfully!")
    print("═" * 55 + "\n")

# ────────────────────────────────────────────────────────────

def build_prompt(subject: str, unit_name: str, topics: list[str]) -> str:
    topics_str = ", ".join(topics)
    return f"""You are an expert teacher creating a quiz for Cambridge Lower Secondary Stage 9 students.

Subject: {subject}
Unit: {unit_name}
Topics covered: {topics_str}

Generate exactly {QUESTIONS_PER_UNIT} multiple choice questions based on these topics.

Rules:
- Questions must be appropriate for Grade 9 students (age 13-14)
- Each question must have exactly 4 options
- Only one option is correct
- Include a short explanation (1-2 sentences) for the correct answer
- Mix easy, medium and hard questions
- Cover ALL topics listed, do not focus on just one
- Do NOT repeat questions

- Each question must include a "hint" field — a short nudge (1 sentence) that helps the student think in the right direction WITHOUT giving away the answer

Return ONLY a valid JSON array with no extra text, no markdown, no code fences.
Each object must follow this exact structure:
{{
  "id": 1,
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 0,
  "explanation": "Brief explanation of why the answer is correct.",
  "hint": "A short nudge to help the student think in the right direction."
}}

The "answer" field is the index (0, 1, 2, or 3) of the correct option.

Return the JSON array now:"""


def call_gemini(prompt: str) -> str:
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )
    return response.text


def parse_response(text: str) -> list:
    from json_repair import repair_json
    
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        cleaned = cleaned.rsplit("```", 1)[0]
    cleaned = cleaned.strip()
    
    # Auto repair any malformed JSON the model returns
    repaired = repair_json(cleaned)
    return json.loads(repaired)


def save_json(file_path: Path, data: dict):
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_unit(subject: str, subject_id: str, unit: dict, done: int, total: int) -> bool:
    output_path = OUTPUT_DIR / subject_id / f"{unit['id']}.json"
    error_path  = OUTPUT_DIR / subject_id / f"{unit['id']}.error.json"

    if output_path.exists():
        print_unit_skipped(unit["name"])
        return True

    if error_path.exists():
        error_path.unlink()

    print_unit_start(unit["name"], done, total)
    prompt     = build_prompt(subject, unit["name"], unit["topics"])
    unit_start = time.time()

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            call_start = time.time()
            frame      = 0

            # Start the API call in a way we can show a live timer
            # We use a simple polling approach with generate_content
            import threading
            result     = {"text": None, "error": None}

            def do_call():
                try:
                    result["text"] = call_gemini(prompt)
                except Exception as e:
                    result["error"] = e

            thread = threading.Thread(target=do_call)
            thread.start()

            while thread.is_alive():
                elapsed = time.time() - call_start
                print_live_timer(elapsed, attempt, frame)
                frame += 1
                time.sleep(0.1)

            thread.join()

            if result["error"]:
                raise result["error"]

            questions = parse_response(result["text"])

            if not isinstance(questions, list) or len(questions) == 0:
                raise ValueError("Response is not a valid list of questions")

            output = {
                "subject":     subject,
                "unit":        unit["name"],
                "unitId":      unit["id"],
                "topics":      unit["topics"],
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "questions":   questions,
            }

            save_json(output_path, output)
            print_unit_done(unit["name"], len(questions), time.time() - unit_start)
            return True

        except Exception as e:
            error_msg = str(e)
            is_network = any(k in error_msg.lower() for k in [
                "timeout", "503", "unavailable", "unreachable",
                "socket", "connect", "network", "reset", "handshaker"
            ])

            if is_network and attempt < MAX_RETRIES:
                print_unit_retry(attempt + 1, RETRY_WAIT, error_msg)
                time.sleep(RETRY_WAIT)
            else:
                print_unit_failed(unit["name"], attempt)
                save_json(error_path, {"error": error_msg, "unit": unit["name"]})
                return False

    return False


def main():
    print_header()

    if not TOPICS_FILE.exists():
        print(f"❌ topics.json not found"); return

    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY not found in .env file")
        print("   Add it to generator/.env")
        return

    global client
    client = genai.Client(api_key=GEMINI_API_KEY)

    with open(TOPICS_FILE, encoding="utf-8") as f:
        data = json.load(f)

    subjects   = data["subjects"]
    total      = sum(len(s["units"]) for s in subjects)
    done       = 0
    failed     = []
    start_time = time.time()

    print(f"  📚 {len(subjects)} subject(s) | {total} units | {QUESTIONS_PER_UNIT} questions each\n")

    for subject in subjects:
        print(f"\n  📖 {subject['name']}  ({len(subject['units'])} units)")
        print("  " + "─" * 45)

        for unit in subject["units"]:
            success = generate_unit(subject["name"], subject["id"], unit, done, total)
            done += 1
            if not success:
                failed.append(f"{subject['name']} → {unit['name']}")
            if done < total:
                time.sleep(DELAY_SECONDS)

    print_summary(total, done - len(failed), failed, time.time() - start_time)


if __name__ == "__main__":
    main()
