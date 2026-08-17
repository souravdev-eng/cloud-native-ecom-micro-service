import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';

import PageNav from '../../components/PageNav/PageNav';
import { userServiceApi } from '../../api/baseUrl';
import { parseErrorMessage } from '../../utils/parseError';
import * as C from '../../styles/common';

/**
 * PUT /api/users/reset-password — body { email, token, newPassword }.
 *
 * The auth service emails
 *   http://ecom.dev/auth/reset-password?token=…&email=…
 * (see auth/src/controllers/forgotPassword.ts), so email and token are read
 * from the query string. Both stay editable: with the notification service
 * down, the token can be copied straight out of the user document in Mongo.
 */
const ResetPasswordPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [form, setForm] = useState({
		email: searchParams.get('email') ?? '',
		token: searchParams.get('token') ?? '',
		newPassword: '',
		confirmPassword: '',
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const update = (field: keyof typeof form, value: string) =>
		setForm((prev) => ({ ...prev, [field]: value }));

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);

		if (!form.email.trim() || !form.token.trim()) {
			setError('Both the email and the reset token are required.');
			return;
		}
		if (!form.newPassword) {
			setError('Choose a new password.');
			return;
		}
		// The endpoint takes no confirmation field, so match them here.
		if (form.newPassword !== form.confirmPassword) {
			setError('The passwords do not match.');
			return;
		}

		setLoading(true);
		try {
			await userServiceApi.put('/reset-password', {
				email: form.email.trim(),
				token: form.token.trim(),
				newPassword: form.newPassword,
			});
			setDone(true);
		} catch (err) {
			setError(parseErrorMessage(err, 'Could not reset your password'));
		} finally {
			setLoading(false);
		}
	};

	if (done) {
		return (
			<C.Page>
				<PageNav title="Password reset" backTo="/user/auth/signin" />
				<C.Narrow>
					<C.EmptyState>
						<CheckCircleIcon sx={{ fontSize: 72, color: '#96f2d7' }} />
						<C.EmptyTitle>Password updated</C.EmptyTitle>
						<C.EmptyText>
							Your reset token has been consumed. Sign in with the new password.
						</C.EmptyText>
						<C.LinkButton to="/user/auth/signin">Sign in</C.LinkButton>
					</C.EmptyState>
				</C.Narrow>
			</C.Page>
		);
	}

	return (
		<C.Page>
			<PageNav title="Choose a new password" backTo="/user/auth/signin" />
			<C.Narrow>
				<C.Card>
					{error && (
						<C.Alert variant="error">
							<ErrorOutlineIcon fontSize="small" />
							<span>{error}</span>
						</C.Alert>
					)}

					<form onSubmit={submit}>
						<C.Field>
							<C.FieldLabel htmlFor="reset-email">Email address</C.FieldLabel>
							<C.TextInput
								id="reset-email"
								type="email"
								autoComplete="email"
								value={form.email}
								onChange={(e) => update('email', e.target.value)}
							/>
						</C.Field>
						<C.Field>
							<C.FieldLabel htmlFor="reset-token">Reset token</C.FieldLabel>
							<C.TextInput
								id="reset-token"
								type="text"
								placeholder="From the reset email"
								value={form.token}
								onChange={(e) => update('token', e.target.value)}
							/>
							<C.FieldHint>
								Prefilled from the link's <C.Mono>?token=</C.Mono> parameter when you
								arrive from the email.
							</C.FieldHint>
						</C.Field>
						<C.Field>
							<C.FieldLabel htmlFor="reset-new-password">New password</C.FieldLabel>
							<C.TextInput
								id="reset-new-password"
								type="password"
								autoComplete="new-password"
								value={form.newPassword}
								onChange={(e) => update('newPassword', e.target.value)}
							/>
						</C.Field>
						<C.Field>
							<C.FieldLabel htmlFor="reset-confirm-password">
								Confirm new password
							</C.FieldLabel>
							<C.TextInput
								id="reset-confirm-password"
								type="password"
								autoComplete="new-password"
								value={form.confirmPassword}
								onChange={(e) => update('confirmPassword', e.target.value)}
							/>
						</C.Field>

						<C.ButtonRow sx={{ marginTop: 0 }}>
							<C.PrimaryButton type="submit" disabled={loading}>
								{loading ? (
									<CircularProgress size={18} sx={{ color: '#fff' }} />
								) : (
									'Reset password'
								)}
							</C.PrimaryButton>
							<C.SecondaryButton
								type="button"
								onClick={() => navigate('/user/auth/forgot-password')}
							>
								Request a new token
							</C.SecondaryButton>
						</C.ButtonRow>
					</form>
				</C.Card>
			</C.Narrow>
		</C.Page>
	);
};

export default ResetPasswordPage;
