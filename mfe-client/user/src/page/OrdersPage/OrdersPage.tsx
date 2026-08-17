import { CircularProgress } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import PageNav from '../../components/PageNav/PageNav';
import * as C from '../../styles/common';
import * as S from './OrdersPage.style';
import {
	ORDER_STATUS_LABEL,
	formatMoney,
	formatOrderDate,
	shortOrderId,
} from '../../utils/money';
import { useOrders } from './OrdersPage.hook';

const MAX_THUMBS = 4;
const FALLBACK_IMAGE = 'https://via.placeholder.com/52?text=No+Image';

const OrdersPage = () => {
	const {
		orders,
		loading,
		error,
		offset,
		pageSize,
		hasMore,
		nextPage,
		prevPage,
		refetch,
	} = useOrders();

	const body = () => {
		if (loading) {
			return (
				<C.LoadingContainer>
					<CircularProgress sx={{ color: '#1a1a2e' }} />
				</C.LoadingContainer>
			);
		}

		if (error) {
			return (
				<>
					<C.Alert variant="error">
						<ErrorOutlineIcon fontSize="small" />
						<span>{error}</span>
					</C.Alert>
					<C.SecondaryButton onClick={refetch}>Try again</C.SecondaryButton>
				</>
			);
		}

		if (orders.length === 0) {
			return (
				<C.EmptyState>
					<ReceiptLongIcon sx={{ fontSize: 72, color: '#dee2e6' }} />
					<C.EmptyTitle>
						{offset > 0 ? 'Nothing on this page' : 'No orders yet'}
					</C.EmptyTitle>
					<C.EmptyText>
						{offset > 0
							? 'You have reached the end of your order history.'
							: 'Orders you place will show up here with their payment status.'}
					</C.EmptyText>
					{offset > 0 ? (
						<C.SecondaryButton onClick={prevPage}>
							Back to previous page
						</C.SecondaryButton>
					) : (
						<C.LinkButton to="/">Start shopping</C.LinkButton>
					)}
				</C.EmptyState>
			);
		}

		return (
			<>
				<S.List>
					{orders.map((order) => {
						const items = order.items ?? [];
						const unitCount = items.reduce((sum, i) => sum + i.quantity, 0);

						return (
							<S.OrderCard key={order.id} to={`/user/orders/${order.id}`}>
								<S.CardTop>
									<div>
										<S.OrderRef>#{shortOrderId(order.id)}</S.OrderRef>
										<S.OrderDate>{formatOrderDate(order.createdAt)}</S.OrderDate>
									</div>
									<C.StatusBadge status={order.status}>
										{ORDER_STATUS_LABEL[order.status] ?? order.status}
									</C.StatusBadge>
								</S.CardTop>

								<S.CardBottom>
									<S.Thumbs>
										{items.slice(0, MAX_THUMBS).map((item) => (
											<S.Thumb
												key={item.id}
												src={item.image || FALLBACK_IMAGE}
												alt={item.title}
												onError={(e) => {
													(e.target as HTMLImageElement).src = FALLBACK_IMAGE;
												}}
											/>
										))}
										{items.length > MAX_THUMBS && (
											<S.MoreThumbs>+{items.length - MAX_THUMBS}</S.MoreThumbs>
										)}
										<S.ItemSummary>
											{items.length} {items.length === 1 ? 'product' : 'products'}
											{unitCount !== items.length && ` · ${unitCount} units`}
										</S.ItemSummary>
									</S.Thumbs>

									<S.AmountBlock>
										<S.AmountLabel>Total</S.AmountLabel>
										<S.Amount>
											{formatMoney(order.totalAmount, order.currency)}
										</S.Amount>
									</S.AmountBlock>
								</S.CardBottom>
							</S.OrderCard>
						);
					})}
				</S.List>

				{(offset > 0 || hasMore) && (
					<S.Pagination>
						<C.SecondaryButton onClick={prevPage} disabled={offset === 0}>
							<ChevronLeftIcon fontSize="small" />
							Previous
						</C.SecondaryButton>
						<S.PageInfo>
							Showing {offset + 1}–{offset + orders.length}
						</S.PageInfo>
						<C.SecondaryButton onClick={nextPage} disabled={!hasMore}>
							Next
							<ChevronRightIcon fontSize="small" />
						</C.SecondaryButton>
					</S.Pagination>
				)}
			</>
		);
	};

	return (
		<C.Page>
			<PageNav
				title="My Orders"
				subtitle={`Page size ${pageSize} · GET /api/v1/order`}
			/>
			<C.Content>{body()}</C.Content>
		</C.Page>
	);
};

export default OrdersPage;
