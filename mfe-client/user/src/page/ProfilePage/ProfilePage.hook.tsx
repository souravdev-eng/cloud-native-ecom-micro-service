import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { userServiceApi } from '../../api/baseUrl';
import { parseErrorMessage } from '../../utils/parseError';

/**
 * The session as the auth service sees it. This is the decoded JWT payload
 * (`{ id, email, role }` signed in loginUser/newUser) plus the standard
 * iat/exp claims — there is no `name`, the token doesn't carry one.
 */
export interface CurrentUser {
	id: string;
	email: string;
	role?: string;
	iat?: number;
	exp?: number;
}

export const useProfile = () => {
	const navigate = useNavigate();

	const [user, setUser] = useState<CurrentUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// PUT /api/users/update-password
	const [passwords, setPasswords] = useState({
		password: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [saving, setSaving] = useState(false);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

	const [signingOut, setSigningOut] = useState(false);

	const fetchUser = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const { data } = await userServiceApi.get('/currentuser');
			// requireAuth guards the route, so a 200 always carries a user — but
			// currentUser is exempt from the 401 interceptor, so handle the
			// logged-out case here rather than assuming a redirect happened.
			setUser(data?.currentUser ?? null);
		} catch (err) {
			setError(parseErrorMessage(err, 'Could not load your account'));
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	const updateField = (field: keyof typeof passwords, value: string) => {
		setPasswords((prev) => ({ ...prev, [field]: value }));
	};

	const changePassword = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();
			setPasswordError(null);
			setPasswordSuccess(null);

			if (!passwords.password || !passwords.newPassword) {
				setPasswordError('Enter your current password and a new one.');
				return;
			}
			// Checked here because the endpoint takes no confirmation field.
			if (passwords.newPassword !== passwords.confirmPassword) {
				setPasswordError('The new passwords do not match.');
				return;
			}
			if (passwords.newPassword === passwords.password) {
				setPasswordError('The new password must differ from the current one.');
				return;
			}

			setSaving(true);
			try {
				const { data } = await userServiceApi.put('/update-password', {
					password: passwords.password,
					newPassword: passwords.newPassword,
				});
				setPasswordSuccess(data?.message ?? 'Password updated successfully!');
				setPasswords({ password: '', newPassword: '', confirmPassword: '' });
			} catch (err) {
				setPasswordError(parseErrorMessage(err, 'Could not update your password'));
			} finally {
				setSaving(false);
			}
		},
		[passwords],
	);

	const signOut = useCallback(async () => {
		setSigningOut(true);
		try {
			await userServiceApi.post('/signout');
		} catch {
			// The cookie is cleared by the response either way; if the call fails
			// the local session is stale anyway, so still send them to sign-in.
		} finally {
			navigate('/user/auth/signin');
		}
	}, [navigate]);

	return {
		user,
		loading,
		error,
		refetch: fetchUser,
		passwords,
		updateField,
		changePassword,
		saving,
		passwordError,
		passwordSuccess,
		signOut,
		signingOut,
	};
};
