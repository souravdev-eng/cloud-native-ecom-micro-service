import { CircularProgress, styled, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import type { PayStage } from '../../hooks/usePayOrder';

/* ============================================================================
 * The three server-side steps of a payment, shown live.
 * ============================================================================
 * Payment spans two services and a webhook, so a single "processing…" spinner
 * hides where a failure actually happened. This makes each step visible: which
 * call is running, which one failed, and — most usefully — whether the card
 * cleared but the webhook never marked the order paid.
 * ========================================================================== */

const STEPS: { stage: PayStage; label: string; detail: string }[] = [
	{
		stage: 'creating_intent',
		label: 'Creating payment intent',
		detail: 'POST /api/v1/order/:id/payment',
	},
	{
		stage: 'confirming_card',
		label: 'Confirming card with Stripe',
		detail: 'stripe.confirmCardPayment()',
	},
	{
		stage: 'awaiting_webhook',
		label: 'Waiting for the order to be marked paid',
		detail: 'POST /api/v1/order/webhook/stripe → GET /api/v1/order/:id',
	},
];

// Where each stage sits in the sequence; anything past it is still upcoming.
const STAGE_INDEX: Record<PayStage, number> = {
	idle: -1,
	creating_intent: 0,
	confirming_card: 1,
	awaiting_webhook: 2,
	webhook_pending: 2,
	succeeded: 3,
	failed: -1,
};

const Wrapper = styled('div')({
	backgroundColor: '#f8f9fa',
	border: '1px solid #e9ecef',
	borderRadius: 10,
	padding: '16px 18px',
	marginBottom: 20,
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
});

const Step = styled('div')({
	display: 'flex',
	alignItems: 'flex-start',
	gap: 10,
});

const StepText = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	minWidth: 0,
});

const StepLabel = styled(Typography)<{ state: 'done' | 'active' | 'todo' | 'error' }>(
	({ state }) => ({
		fontSize: 14,
		fontWeight: state === 'active' ? 600 : 500,
		color:
			state === 'done'
				? '#087f5b'
				: state === 'error'
					? '#c92a2a'
					: state === 'active'
						? '#1a1a2e'
						: '#adb5bd',
	}),
);

const StepDetail = styled(Typography)({
	fontSize: 12,
	color: '#868e96',
	fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
	wordBreak: 'break-all',
});

const PollNote = styled(Typography)({
	fontSize: 12,
	color: '#868e96',
	paddingLeft: 30,
});

interface PaymentProgressProps {
	stage: PayStage;
	/** The step that broke, when stage is 'failed'. */
	failedAt?: PayStage | null;
	/** Which poll attempt we're on, so a long wait doesn't look frozen. */
	pollAttempt?: number;
	pollAttempts?: number;
}

const PaymentProgress = ({
	stage,
	failedAt = null,
	pollAttempt = 0,
	pollAttempts = 0,
}: PaymentProgressProps) => {
	if (stage === 'idle') return null;

	const failed = stage === 'failed';
	// 'failed' isn't a position in the sequence, so on failure the marker comes
	// from failedAt — otherwise every step would render as not-yet-run.
	const current = failed
		? (failedAt ? STAGE_INDEX[failedAt] : 0)
		: STAGE_INDEX[stage];

	return (
		<Wrapper>
			{STEPS.map((step, index) => {
				const state: 'done' | 'active' | 'todo' | 'error' =
					index < current
						? 'done'
						: index === current
							? failed || stage === 'webhook_pending'
								? 'error'
								: 'active'
							: 'todo';

				return (
					<div key={step.stage}>
						<Step>
							{state === 'done' && (
								<CheckCircleIcon sx={{ fontSize: 20, color: '#087f5b' }} />
							)}
							{state === 'active' && (
								<CircularProgress size={16} sx={{ color: '#1a1a2e', mt: '2px' }} />
							)}
							{state === 'error' && (
								<ErrorOutlineIcon sx={{ fontSize: 20, color: '#c92a2a' }} />
							)}
							{state === 'todo' && (
								<RadioButtonUncheckedIcon sx={{ fontSize: 20, color: '#dee2e6' }} />
							)}
							<StepText>
								<StepLabel state={state}>{step.label}</StepLabel>
								<StepDetail>{step.detail}</StepDetail>
							</StepText>
						</Step>

						{step.stage === 'awaiting_webhook' &&
							stage === 'awaiting_webhook' &&
							pollAttempt > 0 && (
								<PollNote>
									Checking order status — attempt {pollAttempt} of {pollAttempts}
								</PollNote>
							)}
					</div>
				);
			})}
		</Wrapper>
	);
};

export default PaymentProgress;
