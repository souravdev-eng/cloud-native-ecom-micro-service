/**
 * Turns an axios failure into one line a human can read.
 *
 * The services don't agree on an error envelope, so all three shapes are
 * handled here rather than in each hook:
 *   { errors: [{ message }] }  — @ecom-micro/common errorHandler (most routes)
 *   { message }                — hand-rolled handlers
 *   { error }                  — the Go review service
 */
export const parseErrorMessage = (
	err: any,
	fallback = 'Something went wrong. Please try again.',
): string => {
	const data = err?.response?.data;

	if (Array.isArray(data?.errors)) {
		const messages = data.errors.map((e: any) => e?.message).filter(Boolean);
		if (messages.length > 0) return messages.join('. ');
	}

	if (data?.message) return data.message;
	if (data?.error) return data.error;

	// No response at all: the service isn't reachable. Say so, because in dev
	// this almost always means the `kubectl port-forward` for it isn't up.
	if (err?.request && !err?.response) {
		return 'Could not reach the service. Is its port-forward running?';
	}

	return fallback;
};
