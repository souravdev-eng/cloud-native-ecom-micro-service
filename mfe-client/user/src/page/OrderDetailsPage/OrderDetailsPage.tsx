import { CircularProgress } from '@mui/material';
import { CardElement, Elements } from '@stripe/react-stripe-js';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';

import PageNav from '../../components/PageNav/PageNav';
import PaymentProgress from '../../components/PaymentProgress/PaymentProgress';
import { CARD_ELEMENT_OPTIONS, stripePromise } from '../../api/stripe';
import * as C from '../../styles/common';
import * as S from './OrderDetailsPage.style';
import {
	ORDER_STATUS_LABEL,
	formatMoney,
	formatOrderDate,
	isCancellable,
	isPayable,
	shortOrderId,
} from '../../utils/money';
import { useOrderDetails } from './OrderDetailsPage.hook';

const FALLBACK_IMAGE = 'https://via.placeholder.com/72?text=No+Image';

const OrderDetailsView = () => {
	const {
		order,
		loading,
		error,
		cancelling,
		actionError,
		notice,
		showCardForm,
		openCardForm,
		closeCardForm,
		cancel,
		pay,
		payment,
		refetch,
	} = useOrderDetails();

	if (loading) {
		return (
			<C.Page>
				<PageNav title="Order" backTo="/user/orders" />
				<C.Content>
					<C.LoadingContainer>
						<CircularProgress sx={{ color: '#1a1a2e' }} />
					</C.LoadingContainer>
				</C.Content>
			</C.Page>
		);
	}

	if (error || !order) {
		return (
			<C.Page>
				<PageNav title="Order" backTo="/user/orders" />
				<C.Content>
					<C.EmptyState>
						<SearchOffIcon sx={{ fontSize: 72, color: '#dee2e6' }} />
						<C.EmptyTitle>Order not available</C.EmptyTitle>
						<C.EmptyText>{error ?? 'This order could not be found.'}</C.EmptyText>
						<C.ButtonRow>
							<C.SecondaryButton onClick={refetch}>Try again</C.SecondaryButton>
							<C.LinkButton to="/user/orders">Back to orders</C.LinkButton>
						</C.ButtonRow>
					</C.EmptyState>
				</C.Content>
			</C.Page>
		);
	}

	const items = order.items ?? [];
	const unitCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const canPay = isPayable(order.status);
	const canCancel = isCancellable(order.status);

	return (
		<C.Page>
			<PageNav
				title={`Order #${shortOrderId(order.id)}`}
				subtitle={<C.Mono>{order.id}</C.Mono>}
				backTo="/user/orders"
			/>

			<C.Content>
				{notice && (
					<C.Alert variant="success">
						<CheckCircleIcon fontSize="small" />
						<span>{notice}</span>
					</C.Alert>
				)}
				{actionError && (
					<C.Alert variant="error">
						<ErrorOutlineIcon fontSize="small" />
						<span>{actionError}</span>
					</C.Alert>
				)}

				<S.Layout>
					{/* ── Items + payment ─────────────────────────────────────── */}
					<div>
						<C.Card>
							<S.StatusHeader>
								<div>
									<C.SectionTitle sx={{ marginBottom: '4px' }}>
										{items.length} {items.length === 1 ? 'item' : 'items'}
										{unitCount !== items.length && ` · ${unitCount} units`}
									</C.SectionTitle>
									<C.FieldHint>Placed {formatOrderDate(order.createdAt)}</C.FieldHint>
								</div>
								<C.StatusBadge status={order.status}>
									{ORDER_STATUS_LABEL[order.status] ?? order.status}
								</C.StatusBadge>
							</S.StatusHeader>

							{items.map((item) => (
								<S.ItemRow key={item.id}>
									<S.ItemImage
										src={item.image || FALLBACK_IMAGE}
										alt={item.title}
										onError={(e) => {
											(e.target as HTMLImageElement).src = FALLBACK_IMAGE;
										}}
									/>
									<S.ItemInfo>
										<S.ItemTitle>{item.title}</S.ItemTitle>
										<S.ItemMeta>
											{formatMoney(item.price, order.currency)} × {item.quantity}
										</S.ItemMeta>
										<S.ItemMeta>
											<C.Mono>{item.productId}</C.Mono>
										</S.ItemMeta>
									</S.ItemInfo>
									<S.ItemTotal>
										{formatMoney(item.price * item.quantity, order.currency)}
									</S.ItemTotal>
								</S.ItemRow>
							))}

							{/* Card form, only for orders that still owe money */}
							{canPay && showCardForm && (
								<S.CardFormWrapper>
									<C.SectionTitle>Complete payment</C.SectionTitle>

									<PaymentProgress
										stage={payment.stage}
										failedAt={payment.failedAt}
										pollAttempt={payment.pollAttempt}
										pollAttempts={payment.pollAttempts}
									/>

									{payment.error && (
										<C.Alert
											variant={
												payment.stage === 'webhook_pending' ? 'info' : 'error'
											}
										>
											{payment.stage === 'webhook_pending' ? (
												<InfoOutlinedIcon fontSize="small" />
											) : (
												<ErrorOutlineIcon fontSize="small" />
											)}
											<span>{payment.error}</span>
										</C.Alert>
									)}

									<S.CardElementWrapper>
										<CardElement options={CARD_ELEMENT_OPTIONS} />
									</S.CardElementWrapper>

									<C.ButtonRow sx={{ marginTop: 0 }}>
										<C.PrimaryButton
											onClick={pay}
											disabled={payment.processing || !payment.isStripeReady}
										>
											{payment.processing ? (
												<CircularProgress size={18} sx={{ color: '#fff' }} />
											) : (
												<>
													<LockOutlinedIcon sx={{ fontSize: 18 }} />
													Pay {formatMoney(order.totalAmount, order.currency)}
												</>
											)}
										</C.PrimaryButton>
										<C.SecondaryButton
											onClick={closeCardForm}
											disabled={payment.processing}
										>
											Cancel
										</C.SecondaryButton>
									</C.ButtonRow>
								</S.CardFormWrapper>
							)}
						</C.Card>

						{/* Raw fields — useful while the order endpoints are being built */}
						<S.MetaCard>
							<C.SectionTitle>Order record</C.SectionTitle>
							<C.Row>
								<C.Label>Order id</C.Label>
								<C.Value>
									<C.Mono>{order.id}</C.Mono>
								</C.Value>
							</C.Row>
							<C.Row>
								<C.Label>Status</C.Label>
								<C.Value>
									<C.Mono>{order.status}</C.Mono>
								</C.Value>
							</C.Row>
							<C.Row>
								<C.Label>Currency</C.Label>
								<C.Value>
									<C.Mono>{order.currency}</C.Mono>
								</C.Value>
							</C.Row>
							<C.Row>
								<C.Label>Stripe payment intent</C.Label>
								<C.Value>
									<C.Mono>{order.stripePaymentIntentId || 'not created yet'}</C.Mono>
								</C.Value>
							</C.Row>
							<C.Row>
								<C.Label>Last updated</C.Label>
								<C.Value>{formatOrderDate(order.updatedAt)}</C.Value>
							</C.Row>
						</S.MetaCard>
					</div>

					{/* ── Summary + actions ───────────────────────────────────── */}
					<C.Card>
						<C.SectionTitle>Summary</C.SectionTitle>

						<C.Row>
							<C.Label>Items</C.Label>
							<C.Value>{unitCount}</C.Value>
						</C.Row>
						<C.Row isTotal>
							<C.Label isTotal>Total paid</C.Label>
							<C.Value isTotal>
								{formatMoney(order.totalAmount, order.currency)}
							</C.Value>
						</C.Row>

						<C.FieldHint sx={{ marginTop: '12px' }}>
							Total is computed server-side from the product replica — the client
							never sends prices.
						</C.FieldHint>

						<C.ButtonRow>
							{canPay && !showCardForm && (
								<C.PrimaryButton onClick={openCardForm}>
									<LockOutlinedIcon sx={{ fontSize: 18 }} />
									Pay now
								</C.PrimaryButton>
							)}
							{canCancel && (
								<C.DangerButton onClick={cancel} disabled={cancelling}>
									{cancelling ? (
										<CircularProgress size={16} color="inherit" />
									) : (
										'Cancel order'
									)}
								</C.DangerButton>
							)}
							<C.SecondaryButton onClick={refetch}>Refresh</C.SecondaryButton>
						</C.ButtonRow>

						{!canCancel && order.status === 'paid' && (
							<C.FieldHint sx={{ marginTop: '12px' }}>
								Paid orders can't be cancelled from here — that needs a refund.
							</C.FieldHint>
						)}
					</C.Card>
				</S.Layout>
			</C.Content>
		</C.Page>
	);
};

// usePayOrder calls useStripe/useElements, so the page must sit inside Elements.
const OrderDetailsPage = () => (
	<Elements stripe={stripePromise}>
		<OrderDetailsView />
	</Elements>
);

export default OrderDetailsPage;
