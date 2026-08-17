import { CircularProgress } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import LockPersonIcon from '@mui/icons-material/LockPersonOutlined';

import PageNav from '../../components/PageNav/PageNav';
import * as C from '../../styles/common';
import { useProfile } from './ProfilePage.hook';

const formatClaimDate = (seconds?: number) => {
	if (!seconds) return '—';
	return new Date(seconds * 1000).toLocaleString();
};

const ProfilePage = () => {
	const {
		user,
		loading,
		error,
		refetch,
		passwords,
		updateField,
		changePassword,
		saving,
		passwordError,
		passwordSuccess,
		signOut,
		signingOut,
	} = useProfile();

	if (loading) {
		return (
			<C.Page>
				<PageNav title="My Account" />
				<C.Content>
					<C.LoadingContainer>
						<CircularProgress sx={{ color: '#1a1a2e' }} />
					</C.LoadingContainer>
				</C.Content>
			</C.Page>
		);
	}

	if (!user) {
		return (
			<C.Page>
				<PageNav title="My Account" />
				<C.Narrow>
					<C.EmptyState>
						<LockPersonIcon sx={{ fontSize: 72, color: '#dee2e6' }} />
						<C.EmptyTitle>You're not signed in</C.EmptyTitle>
						<C.EmptyText>
							{error ?? 'Sign in to see your account details and orders.'}
						</C.EmptyText>
						<C.ButtonRow>
							<C.LinkButton to="/user/auth/signin">Sign in</C.LinkButton>
							<C.SecondaryButton onClick={refetch}>Retry</C.SecondaryButton>
						</C.ButtonRow>
					</C.EmptyState>
				</C.Narrow>
			</C.Page>
		);
	}

	return (
		<C.Page>
			<PageNav title="My Account" subtitle={user.email} />

			<C.Narrow>
				{/* ── Session ─────────────────────────────────────────────── */}
				<C.Card>
					<C.SectionTitle>Session</C.SectionTitle>
					<C.Row>
						<C.Label>Email</C.Label>
						<C.Value>{user.email}</C.Value>
					</C.Row>
					<C.Row>
						<C.Label>User id</C.Label>
						<C.Value>
							<C.Mono>{user.id}</C.Mono>
						</C.Value>
					</C.Row>
					<C.Row>
						<C.Label>Role</C.Label>
						<C.Value>
							<C.Mono>{user.role ?? 'user'}</C.Mono>
						</C.Value>
					</C.Row>
					{/* Token lifetime is genuinely useful while testing: an expired
					    session is the usual cause of a sudden wall of 401s. */}
					<C.Row>
						<C.Label>Token issued</C.Label>
						<C.Value>{formatClaimDate(user.iat)}</C.Value>
					</C.Row>
					<C.Row>
						<C.Label>Token expires</C.Label>
						<C.Value>{formatClaimDate(user.exp)}</C.Value>
					</C.Row>

					<C.FieldHint sx={{ marginTop: '12px' }}>
						These are the claims in the session cookie's JWT, from
						<C.Mono> GET /api/users/currentuser</C.Mono>.
					</C.FieldHint>

					<C.ButtonRow>
						<C.LinkButton to="/user/orders">My orders</C.LinkButton>
						<C.SecondaryButton onClick={signOut} disabled={signingOut}>
							{signingOut ? <CircularProgress size={16} color="inherit" /> : 'Sign out'}
						</C.SecondaryButton>
					</C.ButtonRow>
				</C.Card>

				{/* ── Change password ─────────────────────────────────────── */}
				<C.Card sx={{ marginTop: '20px' }}>
					<C.SectionTitle>Change password</C.SectionTitle>

					{passwordError && (
						<C.Alert variant="error">
							<ErrorOutlineIcon fontSize="small" />
							<span>{passwordError}</span>
						</C.Alert>
					)}
					{passwordSuccess && (
						<C.Alert variant="success">
							<CheckCircleIcon fontSize="small" />
							<span>{passwordSuccess}</span>
						</C.Alert>
					)}

					<form onSubmit={changePassword}>
						<C.Field>
							<C.FieldLabel htmlFor="current-password">Current password</C.FieldLabel>
							<C.TextInput
								id="current-password"
								type="password"
								autoComplete="current-password"
								value={passwords.password}
								onChange={(e) => updateField('password', e.target.value)}
							/>
						</C.Field>
						<C.Field>
							<C.FieldLabel htmlFor="new-password">New password</C.FieldLabel>
							<C.TextInput
								id="new-password"
								type="password"
								autoComplete="new-password"
								value={passwords.newPassword}
								onChange={(e) => updateField('newPassword', e.target.value)}
							/>
						</C.Field>
						<C.Field>
							<C.FieldLabel htmlFor="confirm-password">
								Confirm new password
							</C.FieldLabel>
							<C.TextInput
								id="confirm-password"
								type="password"
								autoComplete="new-password"
								value={passwords.confirmPassword}
								onChange={(e) => updateField('confirmPassword', e.target.value)}
							/>
						</C.Field>

						<C.PrimaryButton type="submit" disabled={saving}>
							{saving ? (
								<CircularProgress size={18} sx={{ color: '#fff' }} />
							) : (
								'Update password'
							)}
						</C.PrimaryButton>
					</form>

					<C.FieldHint sx={{ marginTop: '16px' }}>
						Forgot it instead? <C.TextLink to="/user/auth/forgot-password">
							Email me a reset link
						</C.TextLink>
					</C.FieldHint>
				</C.Card>
			</C.Narrow>
		</C.Page>
	);
};

export default ProfilePage;
