import { NetworkId, synthetix } from '@synthetixio/contracts-interface';
import { ethers } from 'ethers';
import { keyBy } from 'lodash';
import { useMemo } from 'react';
import { createContainer } from 'unstated-next';
import { chain, useNetwork, useProvider } from 'wagmi';

import { DEFAULT_NETWORK_ID } from 'constants/defaults';

const useConnector = () => {
	const { chain: activeChain } = useNetwork();
	const network =
		activeChain !== undefined && activeChain.unsupported
			? chain.optimism
			: activeChain ?? chain.optimism;
	const provider = useProvider({
		chainId: network.id,
	});
	// Provides a default mainnet provider, irrespective of the current network
	const staticMainnetProvider = new ethers.providers.InfuraProvider();
	const defaultSynthetixjs = synthetix({
		provider: provider,
		networkId: network.id as NetworkId,
	});

	const [synthsMap, tokensMap] = useMemo(() => {
		if (defaultSynthetixjs == null) return [{}, {}];

		return [keyBy(defaultSynthetixjs.synths, 'name'), keyBy(defaultSynthetixjs.tokens, 'symbol')];
	}, [defaultSynthetixjs]);

	return {
		synthsMap,
		tokensMap,
		staticMainnetProvider,
		defaultSynthetixjs,
	};
};

const Connector = createContainer(useConnector);

export default Connector;
