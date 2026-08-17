import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface RemoteLocation {
	pathname: string;
	search?: string;
}

export interface RemoteHandle {
	onParentNavigate: (location: RemoteLocation) => void;
}

export type RemoteMount = (
	el: HTMLElement,
	options: {
		initialPath?: string;
		onNavigation?: (location: RemoteLocation) => void;
	},
) => RemoteHandle;

/**
 * Mounts a federated remote once and keeps its router in step with the shell's.
 *
 * The search string is part of the location on purpose. Remotes run on a memory
 * router when mounted here, so anything dropped on the way in is gone for good:
 * `/products?search=phone` would render the unfiltered list, and
 * `/auth/reset-password?token=…&email=…` — the link the auth service emails —
 * would arrive with empty fields. Both directions carry pathname + search.
 */
export const useRemoteMount = (mount: RemoteMount) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const navigate = useNavigate();
	const location = useLocation();

	const handleRef = useRef<RemoteHandle | null>(null);

	// The mount effect runs once, so its closure would otherwise capture the
	// first location forever — this ref keeps the comparison against the current
	// one without re-mounting the remote.
	const currentHref = useRef(`${location.pathname}${location.search}`);
	currentHref.current = `${location.pathname}${location.search}`;

	useEffect(() => {
		if (!ref.current || handleRef.current) return;

		handleRef.current = mount(ref.current, {
			initialPath: currentHref.current,
			onNavigation: (childLocation) => {
				const childHref = `${childLocation.pathname}${childLocation.search ?? ''}`;
				if (currentHref.current !== childHref) {
					navigate(childHref);
				}
			},
		});
	}, [mount, navigate]);

	useEffect(() => {
		handleRef.current?.onParentNavigate({
			pathname: location.pathname,
			search: location.search,
		});
	}, [location.pathname, location.search]);

	return ref;
};
