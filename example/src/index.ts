import {JSONRPCHTTPProvider} from 'eip-1193-jsonrpc-provider';
import {EIP1193ProviderWithoutEvents} from 'eip-1193';

const provider = new JSONRPCHTTPProvider('http://127.0.0.1:8545');

async function main(provider: EIP1193ProviderWithoutEvents) {
	console.log(
		await provider.request({
			method: 'eth_blockNumber',
		})
	);
}

main(provider);
