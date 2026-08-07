"""All LLM prompt templates, kept in one place per project convention.

Every prompt must produce JSON only. Callers strip markdown code fences and
parse with a single retry (see app/llm.py).
"""

RESUME_EXTRACTION_PROMPT = """Extract structured data from this resume. Focus on technical substance.

{resume_text}

Return only JSON, no other text:
{{
  "skills": ["skills should contain only technologies, tools and languages — not degrees or fields of study."],
  "projects": [
    {{"name": "...", "tech": ["..."], "what_it_does": "...", "notable_decisions": "..."}}
  ],
  "experience": [{{"org": "...", "role": "...", "work": "..."}}],
  "education": {{"degree": "...", "year": "..."}}
}}

For notable_decisions, capture any specific technical choice mentioned (a database,
a caching layer, an architecture decision). Use null if none stated.
"""


QUESTION_GENERATION_PROMPT = """You are an experienced technical interviewer for entry-level candidates in India.

Role: {role}
Interview type: {interview_type}
Difficulty: {difficulty}
Number of questions: {question_count}

Candidate background:
{resume_parsed_json}

Previously asked to this candidate (do not repeat or ask minor variations):
{previous_questions}

{type_rules}

A question's type is decided by what it evaluates, not by its sentence structure.
Many technical questions are phrased as a story ("tell me about a time you chose/
built/debugged X") — that phrasing does NOT make it behavioural, as long as the
answer is judged on technical substance, not on how they behaved.
- technical: evaluates tool/domain knowledge, reasoning, or a technical decision.
- behavioural: evaluates conduct — collaboration, conflict, ownership, prioritization,
  handling failure or disagreement — where the answer is judged on how they acted and
  what they'd do differently, not on which tool or technique was correct.

Technical questions must rotate across these angles — do not default to only one
(tradeoff questions in particular are overused; use them for at most one question):
- Tradeoff: why one tool/approach over another they didn't pick.
  e.g. "You used Redis for sessions — why not Postgres?"
- Mechanism: how something they built actually works.
  e.g. "Walk me through what happens when a request hits your API — where does
  Redis come in?"
- Debugging: a specific failure they hit and how they found or fixed it.
  e.g. "Was there ever a time that cache gave you stale data? What happened?"
- Scaling/limits: what breaks or needs to change under more load or data.
  e.g. "If that Redis instance had to hold 10x the sessions, what breaks first?"
- Retrospective: what they'd do differently now, knowing what they know today.
  e.g. "Looking back, is Redis still the right call there, or would you do it
  differently now?"

Across a full set of questions, use at least three different angles above.

{difficulty_rules}

Language, regardless of difficulty:
- Plain, everyday words. Short sentences. One idea per sentence.
- Ask about ONE technology or decision at a time — never stack two or more
  comparisons into a single question.
- No academic or textbook phrasing ("evaluate the trade-offs of...", "under what
  circumstances would you..."). Ask it the way a person would say it out loud.
- Bad (too dense): "How do you evaluate whether to store session data in an
  in-memory key-value store like Redis versus a traditional relational database
  like PostgreSQL, and what performance and persistence trade-offs drive that?"
- Good (same idea, plain): "You used Redis for sessions — why not Postgres?"

Rules:
- At least 60% of questions must reference their actual named projects or skills
- Probe specific things they built — not only "why not X instead", also how it
  works, what broke, what would break under more load, or what they'd change now
- Do not ask anything answerable by reading the resume itself
- Each question answerable in 3-5 sentences of speech
- No questions requiring code to be written out
- If their background does not match the chosen role, state that in one sentence in
  the first question's text, then bridge from what they have done toward this role

Return only JSON:
{{"questions": [{{"text": "...", "type": "technical|behavioural", "targets": "..."}}]}}
"""

TYPE_RULES = {
    "technical": "All questions must be technical.",
    "behavioural": "All questions must be behavioural. No technical questions.",
    "mixed": "Roughly half technical, half behavioural.",
}

DIFFICULTY_RULES = {
    "easy": (
        "Easy: ask about ONE tool, decision, or thing they built, with no added "
        "complexity or hypothetical twist. A confident answer just explains what "
        "they did and one reason why. Do not add 'what if scale increased 10x' or "
        "similar follow-on complications."
    ),
    "medium": (
        "Medium: ask about one thing they built, but expect them to go one level "
        "deeper than naming it — weigh it against an alternative, explain how it "
        "actually works, or describe a specific problem it caused. Pick whichever "
        "angle fits the question, not always the alternative-weighing one."
    ),
    "hard": (
        "Hard: you may add one realistic complication (e.g. a scale increase, a new "
        "constraint, a failure scenario) and ask how they'd adapt — but keep the "
        "sentence short and plain even though the idea is harder."
    ),
}


SCORING_FRAME_PROMPT = """Score this interview answer.

Role: {role}
Question: {question_text}
Answer: {answer_text}

{rubric}

For each dimension, first quote the specific evidence from the answer, then give the
score. Score based only on what is present in the answer — the scores themselves must
stay honest and rigorous, do not inflate them to soften the message.

The "feedback" text is what softens the message, not the score. Write it like a
supportive mentor, not a critic:
- Say what to add or do differently, not just what was missing or wrong.
- Never use harsh absolute words: "fails to", "far too", "completely lacks", "poor".
- Bad: "Your answer is far too brief and fails to answer the core comparison."
- Good: "Naming Redis is a good start — add why it beat Postgres here, ideally with
  a number (latency, load, team size) to back it up."

{transcript_note}

Return only JSON:
{{
  "structure":       {{"evidence": "...", "score": 1-5}},
  "technical_depth": {{"evidence": "...", "score": 1-5}},
  "specificity":     {{"evidence": "...", "score": 1-5}},
  "feedback": "2-3 sentences of encouraging, actionable advice addressed to the candidate"
}}
"""

TRANSCRIPT_NOTE = (
    'This answer is a speech-to-text transcript. Ignore missing punctuation, '
    'capitalisation, and filler words such as "umm". Judge only the organisation '
    'and content of the ideas.'
)

TECHNICAL_RUBRIC = """structure — does the answer have a clear shape?
  1: rambling, no clear arc
  2: some structure attempted, but ideas run together or the arc breaks down partway
  3: describes what they did, but the outcome is vague or missing
  4: clear context and actions, outcome is present but not measurable
  5: clear context, specific actions, measurable outcome

technical_depth — does it explain the reasoning behind decisions?
  1: names tools only ("I used React and Node")
  2: describes what was built, but mostly restates the tools with little reasoning
  3: describes what was built, but not why those choices
  4: explains the reasoning behind a choice, but doesn't weigh it against an alternative
  5: explains tradeoffs and alternatives considered

specificity — are there concrete details?
  1: entirely generic
  2: names a tool or step, but no constraint or number
  3: some detail but no numbers or named constraints
  4: a specific number or a named constraint, but not both
  5: specific numbers, constraints, named problems"""

BEHAVIOURAL_RUBRIC = """structure — is there a clear situation, then action, then result?
  1: rambles, no identifiable situation
  2: situation is identifiable, but action and result blur together
  3: describes a situation and action, but no result
  4: situation, action, and result all present, but one is thin
  5: all three present and clearly separated

technical_depth — here this means reflection
  1: recounts events with no reflection
  2: states how they felt about it, but not what they learned
  3: states an outcome but no learning
  4: says what they learned, but not what they'd do differently
  5: says what they learned and what they would do differently

specificity — is this a real, specific incident?
  1: generic claim ("I always communicate well"), no incident
  2: names a project or team, but the incident itself stays vague
  3: a real incident but thin on detail
  4: named project with real stakes, but missing one concrete detail
  5: named project, real stakes, concrete details"""

RUBRICS = {
    "technical": TECHNICAL_RUBRIC,
    "behavioural": BEHAVIOURAL_RUBRIC,
}


def build_resume_extraction_prompt(resume_text: str) -> str:
    return RESUME_EXTRACTION_PROMPT.format(resume_text=resume_text)


def build_question_generation_prompt(
    role: str,
    interview_type: str,
    difficulty: str,
    question_count: int,
    resume_parsed_json: str,
    previous_questions: str,
) -> str:
    return QUESTION_GENERATION_PROMPT.format(
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        question_count=question_count,
        resume_parsed_json=resume_parsed_json,
        previous_questions=previous_questions or "(none yet)",
        type_rules=TYPE_RULES.get(interview_type, TYPE_RULES["mixed"]),
        difficulty_rules=DIFFICULTY_RULES.get(difficulty, DIFFICULTY_RULES["medium"]),
    )


def build_scoring_prompt(
    role: str,
    question_text: str,
    answer_text: str,
    question_type: str,
    input_mode: str,
) -> str:
    rubric = RUBRICS.get(question_type, TECHNICAL_RUBRIC)
    transcript_note = TRANSCRIPT_NOTE if input_mode == "spoken" else ""
    return SCORING_FRAME_PROMPT.format(
        role=role,
        question_text=question_text,
        answer_text=answer_text,
        rubric=rubric,
        transcript_note=transcript_note,
    )
