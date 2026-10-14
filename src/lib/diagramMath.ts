/** Structural teaching example. These positions are not measured attention weights. */
export function contextWindow(tokens: readonly string[], lastInput: number, windowSize: number) {
  if (!Number.isInteger(lastInput) || lastInput < 0 || lastInput >= tokens.length - 1 ||
      !Number.isInteger(windowSize) || windowSize < 1) throw Error('Invalid illustration window.');
  const start = Math.max(0, lastInput - windowSize + 1);
  return tokens.map((token, position) => ({
    token, position,
    state: position > lastInput ? 'future' as const : position < start ? 'older' as const : 'visible' as const,
    windowPosition: position >= start && position <= lastInput ? position - start : null,
    target: position === lastInput + 1,
  }));
}

/** Inverse-CDF illustration: same vocabulary-order intervals as the generator. */
export function pickProbability(probabilities: ArrayLike<number>, fraction: number) {
  if (!Number.isFinite(fraction) || fraction < 0 || fraction >= 1 || !probabilities.length) throw Error('Invalid draw.');
  let total = 0;
  for (let i = 0; i < probabilities.length; i++) {
    const p = probabilities[i];
    if (!Number.isFinite(p) || p < 0) throw Error('Invalid probability.');
    total += p;
  }
  if (Math.abs(total - 1) > 1e-6) throw Error('Probabilities must sum to one.');
  let remaining = fraction, lastPositive = -1;
  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] > 0) lastPositive = i;
    remaining -= probabilities[i];
    if (remaining < 0) return i;
  }
  return lastPositive;
}
