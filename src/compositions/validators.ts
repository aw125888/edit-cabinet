

export function catalogPostInput(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return { ok: false as const, detail: "Input must be an object." };
  }

  const input = value as Record<string, unknown>;

  if (!Array.isArray(input.tags)) {
    return { ok: false as const, detail: "Tags must be an array." };
  }

  if (input.tags.length < 1 || input.tags.length > 35) {
    return {
      ok: false as const,
      detail: "A post must have between 1 and 35 tags.",
    };
  }

  for (const tag of input.tags) {
  if (
    typeof tag !== "object" ||
    tag === null ||
    typeof (tag as Record<string, unknown>).name !== "string" ||
    typeof (tag as Record<string, unknown>).category !== "string"
  ) {
    return {
      ok: false as const,
      detail: "Each tag must have a name and category.",
    };
  }
}

  return { ok: true as const };

  
}

