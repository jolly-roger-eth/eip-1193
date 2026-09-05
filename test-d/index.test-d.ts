/**
 * Type tests.
 *
 * `EIP1193DATA` and `EIP1193QUANTITY` are the same structural type, so the compiler cannot catch
 * a field that is documented as one and typed as the other. These assertions pin down the things
 * that DO have compile-time consequences: nullability, optionality, non-hex types (`number`,
 * decimal `string`, `boolean`), param arity, and result narrowing.
 *
 * Run with: pnpm test
 */
import type {
	EIP1193Account,
	EIP1193AnyMessage,
	EIP1193Block,
	EIP1193BlockWithTransactions,
	EIP1193DATA,
	EIP1193DebugProvider,
	EIP1193FeeHistory,
	EIP1193GenericRequestProvider,
	EIP1193HttpNodeProvider,
	EIP1193NodeProvider,
	EIP1193Provider,
	EIP1193QUANTITY,
	EIP1193Transaction,
	EIP1193TransactionReceipt,
	EIP1193WalletProvider,
	Methods,
	RequestRPC,
} from '../index';

// ------------------------------------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------------------------------------

type Expect<T extends true> = T;
type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;
type Extends<A, B> = A extends B ? true : false;
type HasKey<T, K extends string> = K extends keyof T ? true : false;
/** True when `K` is present on `T` and may be `undefined` (i.e. declared optional). */
type IsOptional<T, K extends keyof T> = undefined extends T[K] ? true : false;

declare const wallet: EIP1193Provider;
declare const node: EIP1193NodeProvider;
declare const httpNode: EIP1193HttpNodeProvider;
declare const debugNode: EIP1193DebugProvider;

// ------------------------------------------------------------------------------------------------
// A. field types that a wrong spec reading would get wrong
// ------------------------------------------------------------------------------------------------

// eth_feeHistory ratios are raw JSON floats, not hex quantities.
type _A1 = Expect<Equal<EIP1193FeeHistory['gasUsedRatio'], number[]>>;
type _A2 = Expect<Equal<EIP1193FeeHistory['blobGasUsedRatio'], number[] | undefined>>;
// `reward` is only returned when rewardPercentiles was passed.
type _A3 = Expect<IsOptional<EIP1193FeeHistory, 'reward'>>;
type _A4 = Expect<Equal<EIP1193FeeHistory['oldestBlock'], EIP1193QUANTITY>>;
type _A5 = Expect<Equal<EIP1193FeeHistory['baseFeePerGas'], EIP1193QUANTITY[]>>;

// net_version is a DECIMAL string, so `'1'` must be assignable but `0x${string}` must not be required.
type _A6 = Expect<Equal<Methods['net_version']['result'], string>>;

// A pending transaction has a null blockHash.
type _A7 = Expect<Extends<null, EIP1193Transaction['blockHash']>>;
type _A8 = Expect<Extends<null, EIP1193Transaction['blockNumber']>>;

// A contract creation has a null `to`; a receipt for a non-creation has a null contractAddress.
type _A9 = Expect<Extends<null, EIP1193TransactionReceipt['to']>>;
type _A10 = Expect<Extends<null, EIP1193TransactionReceipt['contractAddress']>>;

// `root` is pre-Byzantium only, so it must be optional.
type _A11 = Expect<IsOptional<EIP1193TransactionReceipt, 'root'>>;

// totalDifficulty was removed from execution-apis and from geth: it must not be required.
type _A12 = Expect<IsOptional<EIP1193Block, 'totalDifficulty'>>;

// ------------------------------------------------------------------------------------------------
// B. fields that must exist
// ------------------------------------------------------------------------------------------------

type _B1 = Expect<Equal<EIP1193Block['transactions'], EIP1193DATA[]>>;
type _B2 = Expect<Equal<EIP1193BlockWithTransactions['transactions'], EIP1193Transaction[]>>;
type _B3 = Expect<HasKey<EIP1193Block, 'baseFeePerGas'>>;
type _B4 = Expect<HasKey<EIP1193Block, 'mixHash'>>;
type _B5 = Expect<HasKey<EIP1193Block, 'withdrawals'>>;
type _B6 = Expect<HasKey<EIP1193Block, 'parentBeaconBlockRoot'>>;
type _B7 = Expect<HasKey<EIP1193TransactionReceipt, 'blobGasUsed'>>;

async function fieldsExist() {
	const blk = await wallet.request({method: 'eth_getBlockByNumber', params: ['latest', false]});
	if (!blk) return;
	// hydrated=false gives hashes
	const hashes: EIP1193DATA[] = blk.transactions;
	const fee: EIP1193QUANTITY | undefined = blk.baseFeePerGas;
	return {hashes, fee};
}

// ------------------------------------------------------------------------------------------------
// C. result narrowing on the hydrated flag
// ------------------------------------------------------------------------------------------------

async function narrowing() {
	const hydrated = await wallet.request({method: 'eth_getBlockByNumber', params: ['latest', true]});
	const full: EIP1193Transaction[] | undefined = hydrated?.transactions;

	const plain = await wallet.request({method: 'eth_getBlockByHash', params: ['0xabc', false]});
	const hashes: EIP1193DATA[] | undefined = plain?.transactions;

	// the flag may be omitted entirely
	const omitted = await wallet.request({method: 'eth_getBlockByNumber', params: ['latest']});
	const alsoHashes: EIP1193DATA[] | undefined = omitted?.transactions;

	return {full, hashes, alsoHashes};
}

// ------------------------------------------------------------------------------------------------
// D. params: optional trailing elements, correct casing, contract creation
// ------------------------------------------------------------------------------------------------

async function params() {
	// trailing block tag is optional
	await wallet.request({method: 'eth_getBalance', params: ['0xabc']});
	await wallet.request({method: 'eth_getBalance', params: ['0xabc', 'latest']});
	// EIP-1898 object form
	await wallet.request({method: 'eth_getBalance', params: ['0xabc', {blockHash: '0xdef'}]});
	// bare block hash form (BlockNumberOrTagOrHash)
	await wallet.request({method: 'eth_getBalance', params: ['0xabc', '0xdef']});

	// eth_call: contract creation (no `to`) and 1559 fields
	await wallet.request({method: 'eth_call', params: [{data: '0x60'}]});
	await wallet.request({method: 'eth_call', params: [{to: '0xabc', maxFeePerGas: '0x1'}]});
	// eth_call with a state override
	await wallet.request({
		method: 'eth_call',
		params: [{to: '0xabc'}, 'latest', {'0xabc': {balance: '0x1', stateDiff: {'0x0': '0x1'}}}],
	});
	// eth_estimateGas takes a plain block tag (no block hash), plus an optional state override
	await wallet.request({method: 'eth_estimateGas', params: [{to: '0xabc'}, 'latest']});

	// log filter uses camelCase blockHash
	await wallet.request({method: 'eth_getLogs', params: [{blockHash: '0xabc'}]});
	// and accepts a null topic slot
	await wallet.request({method: 'eth_getLogs', params: [{topics: [null, '0xabc']}]});

	// no-param methods accept an omitted params, and an empty array (what transports send)
	await wallet.request({method: 'eth_blockNumber'});
	await wallet.request({method: 'eth_blockNumber', params: []});

	// feeHistory percentiles are numbers
	await wallet.request({method: 'eth_feeHistory', params: ['0x5', 'latest', [20, 30]]});

	// signTypedData accepts MetaMask's JSON-string form and the object form
	await wallet.request({method: 'eth_signTypedData_v4', params: ['0xabc', '{"types":{}}']});
	await wallet.request({
		method: 'eth_signTypedData_v4',
		params: ['0xabc', {types: {}, primaryType: 'X', domain: {}, message: {}}],
	});
}

// ------------------------------------------------------------------------------------------------
// E. grouping: a wallet has wallet_*, a node does not; a node has subscriptions, a wallet does not
// ------------------------------------------------------------------------------------------------

async function grouping() {
	// EIP-1193 is the browser-wallet interface, so wallet_* belongs on the default provider.
	const added: null = await wallet.request({method: 'wallet_addEthereumChain', params: [{chainId: '0x1'}]});
	const switched: null = await wallet.request({method: 'wallet_switchEthereumChain', params: [{chainId: '0x1'}]});
	const watched: boolean = await wallet.request({
		method: 'wallet_watchAsset',
		params: [{type: 'ERC20', options: {address: '0xabc'}}],
	});
	await wallet.request({method: 'wallet_requestPermissions', params: [{eth_accounts: {}}]});
	await wallet.request({method: 'wallet_revokePermissions', params: [{eth_accounts: {}}]});
	await wallet.request({
		method: 'wallet_sendCalls',
		params: [{version: '2.0.0', chainId: '0x1', atomicRequired: true, calls: []}],
	});
	const accounts: EIP1193Account[] = await wallet.request({method: 'eth_requestAccounts'});

	// browser wallets DO serve subscriptions and filters (they are in MetaMask's api-specs, and
	// EIP-1193 defines the `message` event to carry subscription notifications)
	await wallet.request({method: 'eth_subscribe', params: ['newHeads']});
	await wallet.request({method: 'eth_newBlockFilter'});

	// @ts-expect-error node introspection is not part of the wallet surface
	await wallet.request({method: 'net_peerCount'});
	// @ts-expect-error pre-merge leftovers are not part of the wallet surface
	await wallet.request({method: 'eth_getUncleCountByBlockNumber', params: ['latest']});

	// a plain HTTP endpoint cannot push, so it has no subscriptions
	// @ts-expect-error
	await httpNode.request({method: 'eth_subscribe', params: ['newHeads']});
	await httpNode.request({method: 'eth_getLogs', params: [{}]});

	// the node provider has them
	const sub: EIP1193DATA = await node.request({method: 'eth_subscribe', params: ['newHeads']});
	await node.request({method: 'eth_subscribe', params: ['logs']});
	await node.request({method: 'eth_subscribe', params: ['logs', {address: '0xabc'}]});
	await node.request({method: 'eth_newBlockFilter'});
	await node.request({method: 'eth_getProof', params: ['0xabc', ['0x0']]});

	// @ts-expect-error wallet_* has no meaning server-side
	await node.request({method: 'wallet_addEthereumChain', params: [{chainId: '0x1'}]});

	// debug namespace is opt-in
	await debugNode.request({method: 'debug_traceTransaction', params: ['0xabc']});
	// @ts-expect-error debug is not on a plain node provider
	await node.request({method: 'debug_traceTransaction', params: ['0xabc']});

	return {added, switched, watched, accounts, sub};
}

// ------------------------------------------------------------------------------------------------
// F. mistakes must be rejected
// ------------------------------------------------------------------------------------------------

async function mistakes() {
	// @ts-expect-error typo'd method name
	await wallet.request({method: 'eth_blockNumbr'});
	// @ts-expect-error typo'd method name with params
	await wallet.request({method: 'eth_blockNumbr', params: []});
	// @ts-expect-error too many params
	await wallet.request({method: 'eth_getBalance', params: ['0xabc', 'latest', 'extra']});
	// @ts-expect-error wrong param type
	await wallet.request({method: 'eth_getBalance', params: [1234]});
	// @ts-expect-error lowercase `blockhash` is not the wire name
	await wallet.request({method: 'eth_getLogs', params: [{blockhash: '0xabc'}]});
	// @ts-expect-error missing required param
	await wallet.request({method: 'eth_getTransactionReceipt'});
}

// ------------------------------------------------------------------------------------------------
// G. events
// ------------------------------------------------------------------------------------------------

function events() {
	wallet.on('message', (message) => {
		// narrows, because EIP1193Message is not polluted by a `{type: string}` member
		if (message.type === 'eth_subscription') {
			const id: EIP1193DATA = message.data.subscription;
			return id;
		}
	});

	// a listener accepting the wider union is still assignable
	wallet.on('message', (message: EIP1193AnyMessage) => message.type);

	wallet.on('chainChanged', (chainId) => chainId.slice(2));
	wallet.on('accountsChanged', (accounts) => accounts.length);
	wallet.on('connect', (info) => info.chainId);
	wallet.on('disconnect', (error) => error.code === 4900);
}

// ------------------------------------------------------------------------------------------------
// H. extension points
// ------------------------------------------------------------------------------------------------

type MyMethods = Methods & {my_customMethod: {params: [string]; result: boolean}};
declare const extended: RequestRPC<MyMethods>;

async function extension() {
	const custom: boolean = await extended.request({method: 'my_customMethod', params: ['x']});
	const known = await extended.request({method: 'eth_blockNumber'});

	// untyped escape hatch
	const generic = wallet as unknown as EIP1193GenericRequestProvider;
	const anything = await generic.request<string>({method: 'anything_goes', params: []});
	const named = await generic.request({method: 'named_params', params: {a: 1}});

	return {custom, known, anything, named};
}

// ------------------------------------------------------------------------------------------------
// I. implementability
//
// A concrete provider must still be assignable to these types. This is what a `request()` looks
// like in every real implementation: one untyped method, returning `Promise<any>`. The overload
// set must not make that impossible, which is why the diagnostic overload returns `Promise<any>`
// and not `Promise<never>`.
// ------------------------------------------------------------------------------------------------

class ConcreteProvider {
	async request(args: {method: string; params?: unknown}): Promise<any> {
		return args;
	}
	on(_eventName: string, _listener: (message: any) => unknown): this {
		return this;
	}
	removeListener(_eventName: string, _listener: (message: any) => unknown): this {
		return this;
	}
}

const _asWallet: EIP1193WalletProvider = new ConcreteProvider();
const _asProvider: EIP1193Provider = new ConcreteProvider();
const _asNode: EIP1193NodeProvider = new ConcreteProvider();
const _asGeneric: EIP1193GenericRequestProvider = new ConcreteProvider();

export type {_A1, _A2, _A3, _A4, _A5, _A6, _A7, _A8, _A9, _A10, _A11, _A12};
export type {_B1, _B2, _B3, _B4, _B5, _B6, _B7};
export {fieldsExist, narrowing, params, grouping, mistakes, events, extension};
export {ConcreteProvider, _asWallet, _asProvider, _asNode, _asGeneric};
