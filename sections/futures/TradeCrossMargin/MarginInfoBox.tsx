import Wei, { wei } from '@synthetixio/wei';
import React, { useCallback, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';

import InfoBox from 'components/InfoBox';
import Loader from 'components/Loader';
import PreviewArrow from 'components/PreviewArrow';
import { useFuturesContext } from 'contexts/FuturesContext';
import { FuturesPotentialTradeDetails } from 'queries/futures/types';
import {
	crossMarginAvailableMarginState,
	crossMarginMarginDeltaState,
	leverageSideState,
	marketInfoState,
	orderTypeState,
	positionState,
	potentialTradeDetailsState,
	tradeSizeState,
} from 'store/futures';
import { computeNPFee } from 'utils/costCalculations';
import { formatDollars, formatNumber, formatPercent, zeroBN } from 'utils/formatters/number';

import { PositionSide } from '../types';
import EditLeverageModal from './EditLeverageModal';

type Props = {
	editingLeverage?: boolean;
};

function MarginInfoBox({ editingLeverage }: Props) {
	const position = useRecoilValue(positionState);
	const marketInfo = useRecoilValue(marketInfoState);
	const orderType = useRecoilValue(orderTypeState);
	const leverageSide = useRecoilValue(leverageSideState);
	const { nativeSize } = useRecoilValue(tradeSizeState);
	const potentialTrade = useRecoilValue(potentialTradeDetailsState);
	const marginDelta = useRecoilValue(crossMarginMarginDeltaState);
	const crossMarginFreeMargin = useRecoilValue(crossMarginAvailableMarginState);
	const [openModal, setOpenModal] = useState<'leverage' | 'deposit' | null>(null);

	const { selectedLeverage } = useFuturesContext();

	const totalMargin = position?.remainingMargin.add(crossMarginFreeMargin) ?? zeroBN;

	const availableMargin = position?.accessibleMargin.add(crossMarginFreeMargin) ?? zeroBN;

	const marginUsage = availableMargin.gt(zeroBN)
		? totalMargin.sub(availableMargin).div(totalMargin)
		: zeroBN;

	const isNextPriceOrder = orderType === 1;

	const positionSize = position?.position?.size ? wei(position?.position?.size) : zeroBN;
	const orderDetails = useMemo(() => {
		const newSize =
			leverageSide === PositionSide.LONG ? wei(nativeSize || 0) : wei(nativeSize || 0).neg();
		return { newSize, size: (positionSize ?? zeroBN).add(newSize).abs() };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [leverageSide, positionSize]);

	const { commitDeposit } = useMemo(() => computeNPFee(marketInfo, wei(orderDetails.newSize)), [
		marketInfo,
		orderDetails,
	]);

	const totalDeposit = useMemo(() => {
		return (commitDeposit ?? zeroBN).add(marketInfo?.keeperDeposit ?? zeroBN);
	}, [commitDeposit, marketInfo?.keeperDeposit]);

	const previewTotalMargin = useMemo(() => {
		const remainingMargin = crossMarginFreeMargin.sub(marginDelta);
		return remainingMargin.add(potentialTrade.data?.margin || zeroBN);
	}, [crossMarginFreeMargin, marginDelta, potentialTrade.data?.margin]);

	const getPotentialAvailableMargin = useCallback(
		(previewTrade: FuturesPotentialTradeDetails | null, marketMaxLeverage: Wei | undefined) => {
			let inaccessible;

			inaccessible = previewTrade?.notionalValue.div(marketMaxLeverage).abs() ?? zeroBN;

			// If the user has a position open, we'll enforce a min initial margin requirement.
			if (inaccessible.gt(0)) {
				if (inaccessible.lt(previewTrade?.minInitialMargin ?? zeroBN)) {
					inaccessible = previewTrade?.minInitialMargin ?? zeroBN;
				}
			}

			// check if available margin will be less than 0
			return previewTotalMargin.sub(inaccessible).gt(0)
				? previewTotalMargin.sub(inaccessible).abs()
				: zeroBN;
		},
		[previewTotalMargin]
	);

	const previewAvailableMargin = React.useMemo(() => {
		const potentialAvailableMargin = getPotentialAvailableMargin(
			potentialTrade.data,
			marketInfo?.maxLeverage
		);

		return isNextPriceOrder
			? potentialAvailableMargin?.sub(totalDeposit) ?? zeroBN
			: potentialAvailableMargin;
	}, [
		potentialTrade.data,
		marketInfo?.maxLeverage,
		isNextPriceOrder,
		totalDeposit,
		getPotentialAvailableMargin,
	]);

	const previewTradeData = React.useMemo(() => {
		const size = wei(nativeSize || zeroBN);

		const potentialMarginUsage = potentialTrade.data?.margin.gt(0)
			? previewTotalMargin?.sub(previewAvailableMargin)?.div(previewTotalMargin)?.abs() ?? zeroBN
			: zeroBN;

		return {
			showPreview: !size.eq(0) || !marginDelta.eq(0),
			totalMargin: potentialTrade.data?.margin || zeroBN,
			freeAccountMargin: crossMarginFreeMargin.sub(marginDelta),
			availableMargin: previewAvailableMargin.gt(0) ? previewAvailableMargin : zeroBN,
			leverage: potentialTrade.data?.leverage,
			marginUsage: potentialMarginUsage.gt(1) ? wei(1) : potentialMarginUsage,
		};
	}, [
		nativeSize,
		marginDelta,
		potentialTrade.data?.margin,
		previewAvailableMargin,
		potentialTrade.data?.leverage,
		previewTotalMargin,
		crossMarginFreeMargin,
	]);

	const showPreview = previewTradeData.showPreview && !potentialTrade.data?.showStatus;

	return (
		<>
			<StyledInfoBox
				dataTestId="market-info-box"
				details={{
					'Free Account Margin': {
						value: formatDollars(crossMarginFreeMargin),
						valueNode: (
							<PreviewArrow showPreview={showPreview}>
								{potentialTrade.status === 'fetching' ? (
									<MiniLoader />
								) : (
									formatDollars(previewTradeData.freeAccountMargin)
								)}
							</PreviewArrow>
						),
					},
					'Market Margin': {
						value: formatDollars(position?.remainingMargin),
						valueNode: (
							<PreviewArrow showPreview={showPreview}>
								{potentialTrade.status === 'fetching' ? (
									<MiniLoader />
								) : (
									formatDollars(previewTradeData.totalMargin)
								)}
							</PreviewArrow>
						),
					},
					'Margin Usage': {
						value: formatPercent(marginUsage),
						valueNode: (
							<PreviewArrow showPreview={showPreview}>
								{potentialTrade.status === 'fetching' ? (
									<MiniLoader />
								) : (
									formatPercent(previewTradeData?.marginUsage)
								)}
							</PreviewArrow>
						),
					},
					Leverage: {
						value: (
							<>
								{formatNumber(selectedLeverage, { maxDecimals: 2 })}x
								{!editingLeverage && (
									<EditButton onClick={() => setOpenModal('leverage')}>Edit</EditButton>
								)}
							</>
						),
						valueNode: (
							<PreviewArrow showPreview={showPreview && !!editingLeverage}>
								{formatNumber(previewTradeData.leverage || 0)}
							</PreviewArrow>
						),
					},
				}}
				disabled={marketInfo?.isSuspended}
			/>

			{openModal === 'leverage' && <EditLeverageModal onDismiss={() => setOpenModal(null)} />}
		</>
	);
}

const MiniLoader = () => {
	return <Loader inline height="11px" width="11px" style={{ marginLeft: '10px' }} />;
};

const StyledInfoBox = styled(InfoBox)`
	margin-bottom: 16px;

	.value {
		font-family: ${(props) => props.theme.fonts.regular};
	}
`;

const Button = styled.span`
	transition: all 0.1s ease-in-out;
	&:hover {
		opacity: 0.7;
	}
`;

const EditButton = styled(Button)`
	margin-left: 8px;
	cursor: pointer;
	color: ${(props) => props.theme.colors.selectedTheme.yellow};
`;

export default React.memo(MarginInfoBox);
