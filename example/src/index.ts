import {JSONRPCHTTPProvider} from 'eip-1193-json-provider';
import {EIP1193ProviderWithoutEvents, EIP1193ProviderExtraMethods} from 'eip-1193';

const provider = new JSONRPCHTTPProvider("http://127.0.0.1:8545");

async function main(provider: EIP1193ProviderWithoutEvents & EIP1193ProviderExtraMethods) {
    console.log(await provider.request({
        method: 'eth_blockNumber' 
    }));
}

main(provider);