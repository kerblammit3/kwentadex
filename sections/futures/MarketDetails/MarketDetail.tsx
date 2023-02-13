import { ReactElement, memo, FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import Tooltip from 'components/Tooltip/Tooltip';
import { selectMarketInfo } from 'state/futures/selectors';
import { useAppSelector } from 'state/hooks';

import { isMarketDataKey, marketDataKeyMap } from './utils';

type MarketDetailProps = {
	mobile?: boolean;
	dataKey: string;
	color?: string;
	value: string | ReactElement;
};

const MarketDetail: FC<MarketDetailProps> = memo(({ mobile, dataKey, color, value }) => {
	const { t } = useTranslation();
	const marketInfo = useAppSelector(selectMarketInfo);
	const pausedClass = marketInfo?.isSuspended ? 'paused' : '';

	const contentSuffix = useMemo(() => {
		if (dataKey === marketInfo?.marketName) {
			return 'market-key';
		} else if (isMarketDataKey(dataKey)) {
			return marketDataKeyMap[dataKey];
		} else {
			return '';
		}
	}, [dataKey, marketInfo]);

	return (
		<MarketDetailsTooltip
			key={dataKey}
			mobile={mobile}
			content={t(`exchange.market-details-card.tooltips.${contentSuffix}`)}
		>
			<WithCursor cursor="help">
				<p className="heading">{dataKey}</p>
				<span className={`value ${color || ''} ${pausedClass}`}>{value}</span>
			</WithCursor>
		</MarketDetailsTooltip>
	);
});

export default MarketDetail;

// Extend type of cursor to accept different style of cursor. Currently accept only 'help'
const WithCursor = styled.div<{ cursor: 'help' }>`
	cursor: ${(props) => props.cursor};
`;

const MarketDetailsTooltip = styled(Tooltip).attrs({ position: 'fixed', height: 'auto' })<{
	mobile?: boolean;
}>`
	z-index: 2;
	padding: 10px;
	right: ${(props) => props.mobile && '1px'};
`;
