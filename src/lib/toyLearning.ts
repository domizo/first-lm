/** Small, deterministic teaching calculations. These never read or change model weights. */
export const TOY_INITIAL_LOGITS: readonly number[] = Object.freeze([0, 1, -0.5]);
export const TOY_TARGET_INDEX = 0;
export const TOY_MAX_UPDATES = 10;
export const TOY_MAX_LEARNING_RATE = 2;

/** Clamp a UI value; malformed input returns a known safe fallback. */
export function clampToyInput(value: number, minimum: number, maximum: number, fallback: number): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : fallback));
}

function validateLogits(logits: readonly number[]): void {
  if (!logits.length || logits.some(value => !Number.isFinite(value) || Math.abs(value) > 1e6)) {
    throw new RangeError('Toy logits must be a nonempty list of finite values between -1e6 and 1e6.');
  }
}

function validateTarget(logits: readonly number[], target: number): void {
  if (!Number.isInteger(target) || target < 0 || target >= logits.length) {
    throw new RangeError('The target must identify one of the toy logits.');
  }
}

/** Subtracting the largest logit avoids overflowing the exponentials. */
export function toySoftmax(logits: readonly number[]): number[] {
  validateLogits(logits);
  const maximum = Math.max(...logits);
  const weights = logits.map(value => Math.exp(value - maximum));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map(value => value / total);
}

/** Natural-log cross entropy for a single correct answer; probability must be positive. */
export function toyProbabilityLoss(probability: number): number {
  if (!Number.isFinite(probability) || probability <= 0 || probability > 1) {
    throw new RangeError('The target probability must be greater than 0 and at most 1.');
  }
  return probability === 1 ? 0 : -Math.log(probability);
}

/** Compute the same loss directly from logits, even when a probability underflows to zero. */
export function toyLogitLoss(logits: readonly number[], target: number): number {
  validateLogits(logits);
  validateTarget(logits, target);
  const maximum = Math.max(...logits);
  const total = logits.reduce((sum, value) => sum + Math.exp(value - maximum), 0);
  return Math.log(total) + (maximum - logits[target]);
}

/** d(loss)/d(logit_i) = p_i - y_i, where y is 1 only for the correct answer. */
export function toyLogitGradient(logits: readonly number[], target: number): number[] {
  validateTarget(logits, target);
  return toySoftmax(logits).map((probability, index) => probability - (index === target ? 1 : 0));
}

/** One direct-logit SGD step. This is deliberately not the real network's AdamW update. */
export function toyLogitStep(logits: readonly number[], target: number, learningRate: number): number[] {
  if (!Number.isFinite(learningRate) || learningRate < 0 || learningRate > TOY_MAX_LEARNING_RATE) {
    throw new RangeError('The toy learning rate must be between 0 and 2.');
  }
  const gradient = toyLogitGradient(logits, target);
  const updated = logits.map((value, index) => value - learningRate * gradient[index]);
  validateLogits(updated);
  return updated;
}
