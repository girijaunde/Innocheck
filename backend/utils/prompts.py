def innovation_prompt(problem: str, patterns: str, gaps: str) -> str:
    return (
        "You are an innovation strategist for hackathon teams.\n"
        f"User problem statement:\n{problem}\n\n"
        f"Common patterns found in existing work:\n{patterns}\n\n"
        f"Gaps identified:\n{gaps}\n\n"
        "Generate one strong innovation idea with:\n"
        "1) title\n2) 4-6 line description\n3) 3 concise tags\n"
        "Focus on novelty + feasibility for student teams."
    )


def literature_prompt(problem: str, similar_titles: list[str]) -> str:
    joined = "\n".join(f"- {t}" for t in similar_titles)
    return (
        "Write a concise academic-style literature review (4-6 paragraphs).\n"
        f"Topic: {problem}\n"
        "Use these related works as context:\n"
        f"{joined}\n"
        "Include: intro, prior approaches, current limitations, gaps, and proposed contribution."
    )

