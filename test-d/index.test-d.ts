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
	AnvilMethods,
	DevNodeMethods,
	EIP1193AnvilProvider,
	EIP1193DevNodeProvider,
	EIP1193HardhatProvider,
	EIP1193LegacyTransactionData,
	EIP1193ChainId,
	HardhatMethods,
	AllMethods,
	CoreMethods,
	NodeMethods,
	WalletMethods,
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
	EIP1193CoreProvider,
	EIP1193Provider,
	EIP1193QUANTITY,
	EIP1193Transaction,
	EIP1193TransactionReceipt,
	EIP1193WalletProvider,
	EIP1193AllMethodsProvider,
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
// E2. the core surface accepts every provider and offers only what all of them serve
// ------------------------------------------------------------------------------------------------

declare const core: EIP1193CoreProvider;
declare const allMethods: EIP1193AllMethodsProvider;

const _p1: EIP1193CoreProvider = wallet;
const _p2: EIP1193CoreProvider = node;
const _p3: EIP1193CoreProvider = httpNode;
const _p4: EIP1193CoreProvider = debugNode;
const _p5: EIP1193CoreProvider = allMethods;

async function coreSurface() {
	const chainId: EIP1193QUANTITY = await core.request({method: 'eth_chainId'});
	await core.request({method: 'eth_call', params: [{to: '0xabc', data: '0x'}]});
	await core.request({method: 'eth_sendRawTransaction', params: ['0x00']});
	await core.request({method: 'eth_accounts'});
	await core.request({method: 'eth_sendTransaction', params: [{from: '0xabc'}]});
	await core.request({method: 'eth_newBlockFilter'});

	// @ts-expect-error wallet_* is not served by a node
	await core.request({method: 'wallet_switchEthereumChain', params: [{chainId: '0x1'}]});
	// @ts-expect-error node introspection is not served by a wallet
	await core.request({method: 'eth_getProof', params: ['0xabc', ['0x0']]});
	// @ts-expect-error push subscriptions are not served over plain HTTP
	await core.request({method: 'eth_subscribe', params: ['newHeads']});

	return chainId;
}

// the other directions stay closed: the wallet and node surfaces are not interchangeable
// @ts-expect-error a node provider is not a wallet provider
const _n1: EIP1193WalletProvider = node;
// @ts-expect-error a wallet provider is not a node provider
const _n2: EIP1193NodeProvider = wallet;
// @ts-expect-error a core provider promises neither side's extras
const _n3: EIP1193NodeProvider = core;

// ------------------------------------------------------------------------------------------------
// E3. dev-node methods: on the dev-node providers, and in none of the regular sets
// ------------------------------------------------------------------------------------------------

declare const devNode: EIP1193DevNodeProvider;
declare const hardhat: EIP1193HardhatProvider;
declare const anvil: EIP1193AnvilProvider;

// DevNodeMethods is disjoint from each client group, so a provider type never intersects two entries
type _DN1 = Expect<Equal<keyof DevNodeMethods & keyof HardhatMethods, never>>;
type _DN2 = Expect<Equal<keyof DevNodeMethods & keyof AnvilMethods, never>>;
// the client groups share only evm_setIntervalMining (different units), so they must not be intersected
type _DN11 = Expect<Equal<keyof HardhatMethods & keyof AnvilMethods, 'evm_setIntervalMining'>>;

// no regular set lists a dev-node method: a production endpoint does not serve them
type DevNodeKey = keyof DevNodeMethods | keyof HardhatMethods | keyof AnvilMethods;
type _DN3 = Expect<Equal<DevNodeKey & keyof CoreMethods, never>>;
type _DN4 = Expect<Equal<DevNodeKey & keyof WalletMethods, never>>;
type _DN5 = Expect<Equal<DevNodeKey & keyof NodeMethods, never>>;
type _DN6 = Expect<Equal<DevNodeKey & keyof AllMethods, never>>;

// results are what the clients send: a decimal string or a JSON number, or `null` from Anvil
type _DN7 = Expect<Equal<DevNodeMethods['evm_increaseTime']['result'], string | number>>;
type _DN8 = Expect<Equal<DevNodeMethods['evm_setNextBlockTimestamp']['result'], string | null>>;
type _DN9 = Expect<Equal<DevNodeMethods['hardhat_impersonateAccount']['result'], boolean | null>>;
type _DN10 = Expect<Equal<AnvilMethods['anvil_impersonateAccount']['result'], null>>;

// a dev-node provider is still usable wherever a core provider is expected, and is a node
const _dn1: EIP1193CoreProvider = devNode;
const _dn2: EIP1193NodeProvider = hardhat;
const _dn3: EIP1193NodeProvider = anvil;
const _dn4: EIP1193DevNodeProvider = hardhat;
const _dn5: EIP1193DevNodeProvider = anvil;

async function devNodeSurface() {
	// evm_mine: an empty array, or a timestamp as a number or a hex string
	const mined: string = await devNode.request({method: 'evm_mine', params: []});
	await devNode.request({method: 'evm_mine', params: [1700000000]});
	await devNode.request({method: 'evm_mine', params: ['0x6553f100']});

	const id: EIP1193QUANTITY = await devNode.request({method: 'evm_snapshot'});
	const reverted: boolean = await devNode.request({method: 'evm_revert', params: [id]});
	await devNode.request({method: 'evm_increaseTime', params: [60]});
	await devNode.request({method: 'evm_setNextBlockTimestamp', params: ['0x6553f100']});
	await devNode.request({method: 'evm_setAutomine', params: [false]});
	await devNode.request({method: 'evm_setBlockGasLimit', params: ['0x1c9c380']});

	await devNode.request({method: 'hardhat_impersonateAccount', params: ['0xabc']});
	await devNode.request({method: 'hardhat_stopImpersonatingAccount', params: ['0xabc']});
	const automine: boolean = await devNode.request({method: 'hardhat_getAutomine'});
	await devNode.request({method: 'hardhat_mine', params: []});
	await devNode.request({method: 'hardhat_mine', params: ['0x100', 12]});
	await devNode.request({method: 'hardhat_setBalance', params: ['0xabc', '0xde0b6b3a7640000']});
	await devNode.request({method: 'hardhat_setCode', params: ['0xabc', '0x6080']});
	await devNode.request({method: 'hardhat_setNonce', params: ['0xabc', '0xa']});
	await devNode.request({method: 'hardhat_setStorageAt', params: ['0xabc', '0x0', '0x01']});
	await devNode.request({method: 'hardhat_setCoinbase', params: ['0xabc']});
	await devNode.request({method: 'hardhat_dropTransaction', params: ['0xabc']});
	await devNode.request({method: 'hardhat_setNextBlockBaseFeePerGas', params: ['0x1']});
	await devNode.request({method: 'hardhat_setMinGasPrice', params: ['0x1']});
	await devNode.request({method: 'hardhat_setLoggingEnabled', params: [true]});
	const meta = await devNode.request({method: 'hardhat_metadata'});
	const forkBlock: number | undefined = meta.forkedNetwork?.forkBlockNumber;

	// the core methods are still there
	await devNode.request({method: 'eth_blockNumber'});

	// @ts-expect-error amounts must be hex quantities: Hardhat rejects a JSON number
	await devNode.request({method: 'hardhat_setBalance', params: ['0xabc', 1]});
	// @ts-expect-error Hardhat's evm_mine takes a timestamp only, not Anvil's {timestamp, blocks}
	await devNode.request({method: 'evm_mine', params: [{timestamp: 1, blocks: 2}]});
	// @ts-expect-error typo'd dev-node method name
	await devNode.request({method: 'evm_mien'});
	// @ts-expect-error missing required param
	await devNode.request({method: 'hardhat_impersonateAccount'});
	// @ts-expect-error evm_mine needs params ([] for no timestamp)
	await devNode.request({method: 'evm_mine'});
	// @ts-expect-error Anvil rejects an omitted `params` on hardhat_mine, so `[]` is required
	await devNode.request({method: 'hardhat_mine'});
	// @ts-expect-error the two clients disagree on evm_setIntervalMining's unit, so it is per client
	await devNode.request({method: 'evm_setIntervalMining', params: [1000]});
	// @ts-expect-error anvil_* is not served by Hardhat
	await devNode.request({method: 'anvil_mine', params: []});

	return {mined, reverted, automine, forkBlock};
}

async function hardhatSurface() {
	// milliseconds, or a [min, max] range
	await hardhat.request({method: 'evm_setIntervalMining', params: [5000]});
	await hardhat.request({method: 'evm_setIntervalMining', params: [[3000, 6000]]});
	await hardhat.request({method: 'hardhat_setPrevRandao', params: ['0xabc']});
	await hardhat.request({method: 'evm_mine', params: []});
	await hardhat.request({method: 'eth_getProof', params: ['0xabc', ['0x0']]});

	// @ts-expect-error anvil_* is not served by Hardhat
	await hardhat.request({method: 'anvil_setBalance', params: ['0xabc', '0x1']});
	// @ts-expect-error Hardhat 3 does not serve hardhat_reset
	await hardhat.request({method: 'hardhat_reset'});
}

async function anvilSurface() {
	// seconds, no range
	await anvil.request({method: 'evm_setIntervalMining', params: [5]});
	// @ts-expect-error Anvil does not take a [min, max] range
	await anvil.request({method: 'evm_setIntervalMining', params: [[3, 6]]});

	const none: null = await anvil.request({method: 'anvil_impersonateAccount', params: ['0xabc']});
	await anvil.request({method: 'anvil_mine', params: [10, 0]});
	await anvil.request({method: 'anvil_setBalance', params: ['0xabc', '0x1']});
	const dropped: EIP1193DATA | null = await anvil.request({method: 'anvil_dropTransaction', params: ['0xabc']});
	await anvil.request({method: 'anvil_reset'});
	await anvil.request({method: 'hardhat_reset', params: [{forking: {jsonRpcUrl: 'http://x', blockNumber: 1}}]});
	await anvil.request({method: 'anvil_reset', params: [{jsonRpcUrl: 'http://x'}]});
	const state: EIP1193DATA = await anvil.request({method: 'anvil_dumpState'});
	await anvil.request({method: 'anvil_loadState', params: [state]});
	const offset: number = await anvil.request({method: 'evm_setTime', params: [1700000000]});
	const meta = await anvil.request({method: 'anvil_metadata'});
	const semver: string | null = meta.clientSemver;
	// the shared methods are there too
	await anvil.request({method: 'hardhat_impersonateAccount', params: ['0xabc']});

	// every other Anvil-only entry is callable
	await anvil.request({method: 'anvil_setIntervalMining', params: [5]});
	await anvil.request({method: 'anvil_setTime', params: ['0x6553f100']});
	const increased: number = await anvil.request({method: 'anvil_increaseTime', params: [60]});
	await anvil.request({method: 'anvil_setNextBlockTimestamp', params: [1700000000]});
	const snap: EIP1193QUANTITY = await anvil.request({method: 'anvil_snapshot'});
	await anvil.request({method: 'anvil_revert', params: [snap]});
	await anvil.request({method: 'anvil_setAutomine', params: [true]});
	await anvil.request({method: 'anvil_getAutomine'});
	await anvil.request({method: 'anvil_setBlockGasLimit', params: ['0x1c9c380']});
	await anvil.request({method: 'anvil_stopImpersonatingAccount', params: ['0xabc']});
	await anvil.request({method: 'anvil_autoImpersonateAccount', params: [true]});
	await anvil.request({method: 'hardhat_autoImpersonateAccount', params: [false]});
	await anvil.request({method: 'anvil_addBalance', params: ['0xabc', '0x1']});
	await anvil.request({method: 'hardhat_addBalance', params: ['0xabc', '0x1']});
	await anvil.request({method: 'anvil_setCode', params: ['0xabc', '0x6080']});
	await anvil.request({method: 'anvil_setNonce', params: ['0xabc', '0xa']});
	await anvil.request({method: 'anvil_setStorageAt', params: ['0xabc', '0x0', '0x01']});
	await anvil.request({method: 'anvil_setCoinbase', params: ['0xabc']});
	await anvil.request({method: 'anvil_setChainId', params: [1337]});
	await anvil.request({method: 'anvil_dropAllTransactions'});
	await anvil.request({method: 'hardhat_dropAllTransactions'});
	await anvil.request({method: 'anvil_setNextBlockBaseFeePerGas', params: ['0x1']});
	await anvil.request({method: 'anvil_setMinGasPrice', params: ['0x1']});
	await anvil.request({method: 'anvil_setLoggingEnabled', params: [false]});
	await anvil.request({method: 'hardhat_dumpState', params: [true]});
	await anvil.request({method: 'hardhat_loadState', params: [state]});
	// @ts-expect-error Anvil rejects an omitted `params` on anvil_mine
	await anvil.request({method: 'anvil_mine'});

	// @ts-expect-error hardhat_setPrevRandao is not served by Anvil
	await anvil.request({method: 'hardhat_setPrevRandao', params: ['0xabc']});

	return {none, dropped, offset, semver, increased};
}

// dev-node methods are not on the regular providers
async function devNodeAbsent() {
	// @ts-expect-error not served by a production node
	await node.request({method: 'evm_mine', params: []});
	// @ts-expect-error not served by a wallet
	await wallet.request({method: 'hardhat_impersonateAccount', params: ['0xabc']});
	// @ts-expect-error not served by every provider
	await core.request({method: 'evm_snapshot'});
	// @ts-expect-error not part of the permissive set either
	await allMethods.request({method: 'anvil_mine', params: []});
}

// ------------------------------------------------------------------------------------------------
// E4. legacy transaction data carries an optional chainId, like every other type
// ------------------------------------------------------------------------------------------------

type _L1 = Expect<IsOptional<EIP1193LegacyTransactionData, 'chainId'>>;
type _L2 = Expect<Equal<EIP1193LegacyTransactionData['chainId'], EIP1193ChainId | undefined>>;

async function legacyChainId() {
	await core.request({method: 'eth_sendTransaction', params: [{from: '0xabc', gasPrice: '0x1', chainId: '0x1'}]});
	await core.request({method: 'eth_signTransaction', params: [{type: '0x0', from: '0xabc', chainId: '0x1'}]});
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
const _p6: EIP1193CoreProvider = new ConcreteProvider();
const _dn6: EIP1193HardhatProvider = new ConcreteProvider();
const _dn7: EIP1193AnvilProvider = new ConcreteProvider();

export type {_A1, _A2, _A3, _A4, _A5, _A6, _A7, _A8, _A9, _A10, _A11, _A12};
export type {_B1, _B2, _B3, _B4, _B5, _B6, _B7};
export {fieldsExist, narrowing, params, grouping, mistakes, events, extension};
export {ConcreteProvider, _asWallet, _asProvider, _asNode, _asGeneric};
export {coreSurface, _p1, _p2, _p3, _p4, _p5, _p6, _n1, _n2, _n3};
export type {_DN11, _DN1, _DN2, _DN3, _DN4, _DN5, _DN6, _DN7, _DN8, _DN9, _DN10, _L1, _L2};
export {devNodeSurface, hardhatSurface, anvilSurface, devNodeAbsent, legacyChainId};
export {_dn1, _dn2, _dn3, _dn4, _dn5, _dn6, _dn7};
