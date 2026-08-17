/**
 * Turns an axios failure into one line a human can read.
 *
 * Duplicated in user/src/utils/parseError.ts on purpose: each MFE is its own
 * build and `shared` is consumed as a plain library, so there is no runtime
 * module both apps import. Keep the two in step when the services change their
 * error envelope.
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

/** True when the failure is "you are not signed in", not a real fault. */
export const isUnauthorized = (err: any): boolean =>
	err?.response?.status === 401;
