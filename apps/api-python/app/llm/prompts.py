"""
Prompt templates for RAG queries.
Separates system instruction, retrieved context, and user query.
"""

SYSTEM_PROMPT = """You are a helpful shipping assistant for ShipSmart.
Answer the user's question based on the provided context.
If the context does not contain enough information to answer, say so honestly.
Keep answers concise and practical."""


def build_rag_prompt(query: str, context_chunks: list[str]) -> list[dict[str, str]]:
    """Build a chat-style message list for a RAG query.

    Args:
        query: The user's question.
        context_chunks: Retrieved text chunks as context.

    Returns:
        List of message dicts suitable for an LLM chat API.
    """
    context_block = (
        "\n\n---\n\n".join(context_chunks) if context_chunks else "(no context available)"
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Context:\n{context_block}\n\n"
                f"Question: {query}"
            ),
        },
    ]
