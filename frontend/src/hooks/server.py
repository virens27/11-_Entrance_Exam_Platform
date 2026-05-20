"""
backend/server.py
─────────────────
11+ AI Exam Platform — FastAPI Backend

SETUP:
  1. pip install fastapi uvicorn openai supabase python-dotenv apscheduler
  2. Create .env file next to this file (see .env.example)
  3. Run: uvicorn server:app --reload --port 8000
  4. Test it works: open http://localhost:8000/test-connection
  5. Seed DB: POST http://localhost:8000/seed-all

IMPORTANT: Use the SERVICE ROLE key in .env (NOT the anon key).
           Find it in Supabase → Settings → API → service_role secret
"""

import hashlib
import json
import logging
import os
import random
import asyncio
import time
from datetime import datetime
from dotenv import load_dotenv

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from supabase import create_client, Client
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# ── Load .env FIRST before anything else ─────────────────────
load_dotenv()

# ── Logging ───────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s"
)
log = logging.getLogger(__name__)

# ── Validate env vars on startup ──────────────────────────────
OPENAI_API_KEY      = os.getenv("OPENAI_API_KEY", "")
SUPABASE_URL        = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not OPENAI_API_KEY:
    raise RuntimeError("❌  OPENAI_API_KEY is missing from .env")
if not SUPABASE_URL:
    raise RuntimeError("❌  SUPABASE_URL is missing from .env")
if not SUPABASE_SERVICE_KEY:
    raise RuntimeError("❌  SUPABASE_SERVICE_KEY is missing from .env")

log.info("✅ Environment variables loaded")
log.info(f"   SUPABASE_URL        = {SUPABASE_URL}")
log.info(f"   OPENAI_API_KEY      = {OPENAI_API_KEY[:12]}...")
log.info(f"   SUPABASE_SERVICE_KEY= {SUPABASE_SERVICE_KEY[:12]}...")

# ── Clients ───────────────────────────────────────────────────
openai_client: OpenAI = OpenAI(api_key=OPENAI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ── Constants ─────────────────────────────────────────────────
TOPICS = ["number", "algebra", "geometry", "data", "patterns"]

DIFFICULTY_CONFIG = {
    "beginner": {
        "label":       "Beginner (11+ standard)",
        "level_tags":  ["B1", "B2", "B3", "B4", "B5"],
        "description": "Single-step problems for students just starting 11+ preparation.",
        "score_range": "20-40",
    },
    "medium": {
        "label":       "Intermediate (11+ standard)",
        "level_tags":  ["I1", "I2", "I3", "I4", "I5"],
        "description": "Multi-step problems. Core 11+ exam difficulty.",
        "score_range": "41-70",
    },
    "hard": {
        "label":       "Advanced / Scholarship",
        "level_tags":  ["A1", "A2", "A3", "A4", "A5"],
        "description": "Scholarship-level problems requiring creative thinking.",
        "score_range": "71-100",
    },
}

TOPIC_SUBTOPICS = {
    "number":   ["Fractions", "Percentages", "Prime Numbers", "Square Numbers",
                 "HCF & LCM", "Negative Numbers", "Place Value", "Rounding"],
    "algebra":  ["Linear Equations", "Word Problems", "Substitution",
                 "Inequalities", "Number Patterns", "Formulae"],
    "geometry": ["Area & Perimeter", "Volume & Surface Area", "Circles",
                 "Angles", "Scale & Bearings", "Symmetry", "Coordinates"],
    "data":     ["Mean Median Mode", "Probability", "Ratios & Proportions",
                 "Bar Charts", "Pie Charts", "Frequency Tables"],
    "patterns": ["Number Sequences", "Shape Patterns", "Logical Reasoning",
                 "Matrix Patterns", "Odd One Out"],
}

NAMES = [
    "Aisha", "Ben", "Chloe", "Dev", "Ella", "Finn", "Grace", "Harry",
    "Isla", "Jaya", "Kai", "Lena", "Max", "Nina", "Omar", "Priya",
    "Quinn", "Riya", "Sam", "Tara", "Uma", "Vera", "Will", "Xara",
    "Yusuf", "Zoe",
]
SCENARIOS = [
    "at a school fair", "on a train journey", "in a supermarket",
    "during sports day", "on a camping trip", "at a bakery",
    "in a library", "during a science experiment", "at a swimming pool",
    "on a school trip to a museum", "at a farmers market", "in a garden",
    "at a birthday party", "during a bake sale", "at a theme park",
]

LOW_WATERMARK   = 25   # generate new batch when available < this
BATCH_SIZE      = 50   # questions per batch
DELETE_INTERVAL = 10   # minutes between cleanup runs


# ════════════════════════════════════════════════════════════════
#  PROMPT BUILDER
# ════════════════════════════════════════════════════════════════
def build_prompt(topic: str, difficulty: str, level_tag: str) -> str:
    cfg      = DIFFICULTY_CONFIG[difficulty]
    subtopic = random.choice(TOPIC_SUBTOPICS[topic])
    name     = random.choice(NAMES)
    scenario = random.choice(SCENARIOS)
    seed_num = random.randint(2, 999)

    return f"""You are an expert 11+ Mathematics question writer for UK students aged 10-13.

Generate ONE unique multiple-choice question with these exact specifications:

Topic        : {topic} — specifically about {subtopic}
Difficulty   : {cfg['label']} — {cfg['description']}
Level tag    : {level_tag}
Difficulty score: integer between {cfg['score_range']}

UNIQUENESS SEEDS — you MUST include all three in the question:
  • Character name  : {name}
  • Scenario        : {scenario}
  • A specific number: {seed_num}

REQUIREMENTS:
  • Solvable in under 3 minutes
  • Exactly 4 options labelled a, b, c, d — ONE correct answer only
  • Wrong options must be plausible common mistakes (not obviously wrong)
  • Hint: max 12 words, nudges without revealing answer
  • Explanation: 3-5 numbered steps with full working shown
  • All numbers must be realistic for UK 11+ exam context

YOU MUST RESPOND WITH ONLY THIS JSON — no markdown, no explanation, no extra text:
{{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_option": "a",
  "hint": "...",
  "explanation": "Step 1: ...\\nStep 2: ...\\nStep 3: ...",
  "difficulty_score": 35,
  "subtopic": "{subtopic}"
}}"""


# ════════════════════════════════════════════════════════════════
#  GENERATE ONE QUESTION via OpenAI
# ════════════════════════════════════════════════════════════════
def generate_one_question(topic: str, difficulty: str, level_tag: str) -> dict | None:
    prompt = build_prompt(topic, difficulty, level_tag)
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",       # cheaper + fast, good enough for 11+ questions
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,           # high = more variety between questions
            max_tokens=700,
            response_format={"type": "json_object"},  # forces valid JSON output
        )
        raw  = response.choices[0].message.content.strip()
        log.debug(f"  OpenAI raw response: {raw[:100]}…")
        data = json.loads(raw)

        # Validate all required fields exist
        required = [
            "question_text", "option_a", "option_b",
            "option_c", "option_d", "correct_option"
        ]
        missing = [k for k in required if k not in data]
        if missing:
            log.warning(f"  Missing fields: {missing}")
            return None

        if data["correct_option"] not in ("a", "b", "c", "d"):
            log.warning(f"  Invalid correct_option: {data['correct_option']}")
            return None

        # Attach metadata
        data["topic"]          = topic
        data["difficulty"]     = difficulty
        data["level_tag"]      = level_tag
        data["question_hash"]  = hashlib.md5(
            data["question_text"].encode("utf-8")
        ).hexdigest()
        return data

    except json.JSONDecodeError as e:
        log.error(f"  JSON parse error: {e}")
        return None
    except Exception as e:
        log.error(f"  OpenAI error for {topic}/{difficulty}: {e}")
        return None


# ════════════════════════════════════════════════════════════════
#  INSERT ONE QUESTION INTO SUPABASE
# ════════════════════════════════════════════════════════════════
def insert_question(q: dict, batch_id: str) -> bool:
    """
    Returns True if inserted successfully.
    Returns False if duplicate (question_hash conflict) — expected, silent.
    """
    row = {
        "question_text":   q["question_text"],
        "option_a":        q["option_a"],
        "option_b":        q["option_b"],
        "option_c":        q["option_c"],
        "option_d":        q["option_d"],
        "correct_option":  q["correct_option"],
        "hint":            q.get("hint", ""),
        "explanation":     q.get("explanation", ""),
        "topic":           q["topic"],
        "difficulty":      q["difficulty"],
        "level_tag":       q.get("level_tag"),
        "difficulty_score": int(q["difficulty_score"]) if q.get("difficulty_score") else None,
        "subtopic":        q.get("subtopic"),
        "question_hash":   q["question_hash"],
        "batch_id":        batch_id,
        "is_used":         False,
        "assigned_to":     None,
    }
    try:
        result = supabase.table("questions").insert(row).execute()
        return True
    except Exception as e:
        err_str = str(e)
        if "question_hash" in err_str or "unique" in err_str.lower() or "duplicate" in err_str.lower():
            log.debug(f"  Duplicate skipped")
            return False
        log.error(f"  ❌ Insert error: {e}")
        log.error(f"     Row was: topic={row['topic']} diff={row['difficulty']}")
        return False


# ════════════════════════════════════════════════════════════════
#  GENERATE A FULL BATCH OF 50 QUESTIONS
# ════════════════════════════════════════════════════════════════
def generate_batch(topic: str, difficulty: str) -> dict:
    """
    Generates BATCH_SIZE questions for a topic+difficulty combo.
    Cycles through level_tags evenly (B1→B5 for beginner, etc.)
    """
    level_tags = DIFFICULTY_CONFIG[difficulty]["level_tags"]
    timestamp  = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    batch_id   = f"batch_{timestamp}_{topic}_{difficulty}"

    log.info(f"")
    log.info(f"🚀 Starting batch: topic={topic} difficulty={difficulty} size={BATCH_SIZE}")
    log.info(f"   batch_id = {batch_id}")

    inserted = 0
    skipped  = 0
    errors   = 0

    for i in range(BATCH_SIZE):
        level_tag = level_tags[i % len(level_tags)]   # B1,B2,B3,B4,B5,B1,B2...

        q = generate_one_question(topic, difficulty, level_tag)

        if q is None:
            errors += 1
            log.warning(f"  ⚠️  Generation failed (attempt {i+1}, errors={errors})")
            if errors >= 10:
                log.error("  Too many errors — stopping batch early")
                break
            time.sleep(1)   # back off before retry
            continue

        errors = 0  # reset error counter on success

        if insert_question(q, batch_id):
            inserted += 1
            log.info(
                f"  ✅ [{inserted:>2}/{BATCH_SIZE}] [{level_tag}] "
                f"{q['question_text'][:60]}…"
            )
        else:
            skipped += 1

        time.sleep(0.3)   # ~3 req/sec — well within OpenAI rate limits

    # Log the batch summary to question_batches table
    try:
        supabase.table("question_batches").insert({
            "id":              batch_id,
            "topic":           topic,
            "difficulty":      difficulty,
            "questions_count": inserted,
        }).execute()
        log.info(f"  📋 Batch logged to question_batches table")
    except Exception as e:
        log.warning(f"  Could not log batch to DB: {e}")

    log.info(f"✅ Batch done — inserted={inserted} skipped(dupes)={skipped} errors={errors}")
    return {"inserted": inserted, "skipped": skipped, "errors": errors, "batch_id": batch_id}


# ════════════════════════════════════════════════════════════════
#  AUTO-REFILL: runs every 5 minutes
# ════════════════════════════════════════════════════════════════
async def check_and_refill():
    """
    Reads the pool_health view.
    For every topic+difficulty with < LOW_WATERMARK available
    questions → generates a new batch of BATCH_SIZE.
    """
    log.info("🔍 Running pool health check…")

    try:
        result = supabase.table("pool_health").select("*").execute()
        health = result.data or []
    except Exception as e:
        log.error(f"❌ Could not read pool_health view: {e}")
        log.error("   Make sure you ran the patch SQL in Supabase SQL Editor!")
        return

    # Build a map of what's available right now
    available_map: dict[tuple, int] = {}
    for row in health:
        key = (row["topic"], row["difficulty"])
        available_map[key] = int(row.get("available") or 0)

    needs_refill = []
    for topic in TOPICS:
        for difficulty in DIFFICULTY_CONFIG:
            available = available_map.get((topic, difficulty), 0)
            if available < LOW_WATERMARK:
                needs_refill.append((topic, difficulty, available))
            else:
                log.info(f"  ✓ {topic}/{difficulty}: {available} available (OK)")

    if not needs_refill:
        log.info("✅ All pools healthy — nothing to generate")
        return

    log.info(f"⚡ {len(needs_refill)} pool(s) need refilling")

    loop = asyncio.get_event_loop()
    for topic, difficulty, current in needs_refill:
        log.info(f"  Refilling {topic}/{difficulty} (has {current}, need {LOW_WATERMARK}+)")
        await loop.run_in_executor(None, generate_batch, topic, difficulty)


# ════════════════════════════════════════════════════════════════
#  AUTO-DELETE: runs every 10 minutes
# ════════════════════════════════════════════════════════════════
async def delete_used_questions():
    """Deletes all questions marked is_used=True to keep the DB clean."""
    log.info("🗑️  Cleaning up used questions…")
    try:
        result = (
            supabase.table("questions")
            .delete()
            .eq("is_used", True)
            .execute()
        )
        deleted = len(result.data) if result.data else 0
        log.info(f"  Deleted {deleted} used questions")
    except Exception as e:
        log.error(f"❌ Delete error: {e}")


# ════════════════════════════════════════════════════════════════
#  FASTAPI APP
# ════════════════════════════════════════════════════════════════
app = FastAPI(title="11+ AI Question Backend", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # lock down to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def startup():
    log.info("🌟 Server starting up…")

    # Test Supabase connection
    try:
        test = supabase.table("questions").select("id", count="exact").limit(1).execute()
        log.info(f"✅ Supabase connected — questions table has {test.count} rows")
    except Exception as e:
        log.error(f"❌ Supabase connection failed: {e}")
        log.error("   Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")

    # Test OpenAI connection
    try:
        openai_client.models.list()
        log.info("✅ OpenAI connected")
    except Exception as e:
        log.error(f"❌ OpenAI connection failed: {e}")
        log.error("   Check OPENAI_API_KEY in .env")

    # Start background jobs
    scheduler.add_job(check_and_refill,      "interval", minutes=5,  id="refill",  replace_existing=True)
    scheduler.add_job(delete_used_questions, "interval", minutes=10, id="cleanup", replace_existing=True)
    scheduler.start()
    log.info("⏰ Scheduler started — refill every 5 min, cleanup every 10 min")

    # Run initial pool check immediately
    log.info("🔍 Running initial pool check…")
    await check_and_refill()


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
    log.info("Server shut down")


# ─────────────────────────────────────────────────────────────
#  ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "11+ AI Question Backend",
        "endpoints": {
            "test":      "GET  /test-connection",
            "health":    "GET  /health",
            "stats":     "GET  /stats",
            "seed_all":  "POST /seed-all",
            "generate":  "POST /generate/{topic}/{difficulty}",
        }
    }


@app.get("/test-connection")
async def test_connection():
    """
    Use this first to verify your .env keys are working.
    Visit http://localhost:8000/test-connection in your browser.
    """
    results = {}

    # Test Supabase
    try:
        r = supabase.table("questions").select("id", count="exact").execute()
        results["supabase"] = {
            "status": "✅ connected",
            "questions_in_db": r.count,
        }
    except Exception as e:
        results["supabase"] = {"status": f"❌ FAILED: {str(e)}"}

    # Test pool_health view
    try:
        r = supabase.table("pool_health").select("*").execute()
        results["pool_health_view"] = {
            "status": "✅ readable",
            "rows": r.data,
        }
    except Exception as e:
        results["pool_health_view"] = {
            "status": f"❌ FAILED: {str(e)}",
            "fix": "Run the patch SQL in Supabase SQL Editor"
        }

    # Test OpenAI
    try:
        openai_client.models.list()
        results["openai"] = {"status": "✅ connected"}
    except Exception as e:
        results["openai"] = {"status": f"❌ FAILED: {str(e)}"}

    # Test question generation (generates 1 question, does NOT save it)
    try:
        q = generate_one_question("number", "beginner", "B1")
        if q:
            results["ai_generation"] = {
                "status": "✅ working",
                "sample_question": q["question_text"][:80] + "…",
            }
        else:
            results["ai_generation"] = {"status": "❌ returned None — check logs"}
    except Exception as e:
        results["ai_generation"] = {"status": f"❌ FAILED: {str(e)}"}

    return results


@app.get("/health")
async def health():
    """Returns current pool counts per topic+difficulty."""
    try:
        result = supabase.table("pool_health").select("*").execute()
        return {"status": "ok", "pools": result.data}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.get("/stats")
async def stats():
    """Full DB statistics."""
    try:
        total    = supabase.table("questions").select("id", count="exact").execute()
        unused   = supabase.table("questions").select("id", count="exact").eq("is_used", False).execute()
        used     = supabase.table("questions").select("id", count="exact").eq("is_used", True).execute()
        assigned = supabase.table("questions").select("id", count="exact").not_.is_("assigned_to", "null").execute()
        batches  = supabase.table("question_batches").select("id", count="exact").execute()
        return {
            "total_questions":       total.count,
            "available_for_use":     unused.count,
            "currently_assigned":    assigned.count,
            "used_pending_delete":   used.count,
            "total_batches_generated": batches.count,
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/generate/{topic}/{difficulty}")
async def manual_generate(topic: str, difficulty: str, background_tasks: BackgroundTasks):
    """
    Manually trigger generation for one topic+difficulty.
    Example: POST /generate/number/beginner
    """
    if topic not in TOPICS:
        return {"error": f"Invalid topic. Choose from: {TOPICS}"}
    if difficulty not in DIFFICULTY_CONFIG:
        return {"error": f"Invalid difficulty. Choose from: {list(DIFFICULTY_CONFIG.keys())}"}

    background_tasks.add_task(generate_batch, topic, difficulty)
    return {
        "status":  "started",
        "message": f"Generating {BATCH_SIZE} questions for {topic}/{difficulty}",
        "tip":     "Watch server logs or poll GET /stats to see progress",
    }


@app.post("/seed-all")
async def seed_all(background_tasks: BackgroundTasks):
    """
    ONE-TIME: Seeds ALL topic+difficulty combos.
    Call this once before students start using the app.
    Total: 5 topics × 3 difficulties × 50 = 750 questions
    """
    jobs = []
    for topic in TOPICS:
        for difficulty in DIFFICULTY_CONFIG:
            background_tasks.add_task(generate_batch, topic, difficulty)
            jobs.append(f"{topic}/{difficulty}")

    return {
        "status":  "started",
        "message": f"Generating {len(jobs)} batches ({len(jobs) * BATCH_SIZE} questions total)",
        "batches": jobs,
        "tip":     "Watch server logs or poll GET /stats to see progress",
    }


@app.delete("/cleanup-now")
async def cleanup_now():
    """Force-delete all used questions immediately."""
    await delete_used_questions()
    return {"status": "done"}