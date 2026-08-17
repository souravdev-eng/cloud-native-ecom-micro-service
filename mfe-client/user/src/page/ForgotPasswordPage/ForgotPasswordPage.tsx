import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailReadOutlined';

import PageNav from '../../components/PageNav/PageNav';
import { userServiceApi } from '../../api/baseUrl';
import { parseErrorMessage } from '../../utils/parseError';
import * as C from '../../styles/common';

/**
 * POST /api/users/forgot-password — body { email }.
 *
 * The auth service stores a reset token on the user and publishes a
 * "Password reset" message to RabbitMQ; the notification service is what
 * actually sends the mail. So a 200 here means "token issued and event
 * published", not "mail delivered" — worth saying on screen, since a stopped
 * notification service looks identical to a working one from the browser.
 */
const ForgotPasswordPage = () => {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!email.trim()) {
			setError('Enter the email address on your account.');
			return;
		}

		setLoading(true);
		setError(null);
		try {
			await userServiceApi.post('/forgot-password', { email: email.trim() });
			setSent(true);
		} catch (err) {
			setError(parseErrorMessage(err, 'Could not start a password reset'));
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<C.Page>
				<PageNav title="Reset your password" backTo="/user/auth/signin" />
				<C.Narrow>
					<C.EmptyState>
						<MarkEmailReadIcon sx={{ fontSize: 72, color: '#96f2d7' }} />
						<C.EmptyTitle>Reset link on its way</C.EmptyTitle>
						<C.EmptyText>
							A reset token was issued for <strong>{email}</strong> and queued for
							delivery. The emailed link points at{' '}
							<C.Mono>/auth/reset-password</C.Mono>, which this app handles — or
							paste the token in manually below.
						</C.EmptyText>
						<C.ButtonRow>
							<C.LinkButton to="/user/auth/reset-password">
								Enter the token
							</C.LinkButton>
							<C.SecondaryButton onClick={() => setSent(false)}>
								Use a different email
							</C.SecondaryButton>
						</C.ButtonRow>
					</C.EmptyState>
				</C.Narrow>
			</C.Page>
		);
	}

	return (
		<C.Page>
			<PageNav title="Reset your password" backTo="/user/auth/signin" />
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
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
							<C.FieldHint>
								We'll email a reset link to this address if an account exists.
							</C.FieldHint>
						</C.Field>

						<C.PrimaryButton type="submit" disabled={loading}>
							{loading ? (
								<CircularProgress size={18} sx={{ color: '#fff' }} />
							) : (
								'Send reset link'
							)}
						</C.PrimaryButton>
					</form>

					<C.FieldHint sx={{ marginTop: '16px' }}>
						Remembered it? <C.TextLink to="/user/auth/signin">Sign in</C.TextLink>
					</C.FieldHint>
				</C.Card>
			</C.Narrow>
		</C.Page>
	);
};

export default ForgotPasswordPage;
