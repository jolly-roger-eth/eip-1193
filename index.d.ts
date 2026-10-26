// ------------------------------------------------------------------------------------------------
// PRIMITIVES
// ------------------------------------------------------------------------------------------------

/**
 * Unformatted binary data, hex-encoded with a `0x` prefix.
 *
 * NOTE: `EIP1193DATA` and `EIP1193QUANTITY` are the SAME structural type. The distinction is
 * documentation only: TypeScript cannot tell them apart, so mislabelling one as the other is
 * invisible to the compiler. That is exactly how several fields in this file drifted away from
 * the spec in the past. `test-d/index.test-d.ts` exists to catch that drift by asserting against
 * real payload shapes.
 */
export type EIP1193DATA = `0x${string}`;

/**
 * An unsigned integer, hex-encoded with a `0x` prefix and no leading zeroes.
 * See the note on {@link EIP1193DATA}: structurally identical, semantically different.
 */
export type EIP1193QUANTITY = `0x${string}`;

/** An EIP-155 chain id, hex-encoded per EIP-695. */
export type EIP1193ChainId = `0x${string}`;

/** A 20-byte address. */
export type EIP1193Account = `0x${string}`;

export type EIP1193Accounts = EIP1193Account[];

/** A list of addresses, e.g. as a log-filter constraint. Unrelated to owned accounts. */
export type EIP1193AddressList = EIP1193Account[];

export type EIP1193BlockTag = EIP1193QUANTITY | 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized';

/**
 * A block tag that also accepts a block hash.
 *
 * Two spellings are accepted in the wild:
 * - the EIP-1898 object forms (`{blockHash, requireCanonical?}` / `{blockNumber}`)
 * - a bare 32-byte block hash, which is what `execution-apis` now specifies
 *   (`BlockNumberOrTagOrHash`)
 *
 * The bare-hash form is already covered by `EIP1193QUANTITY`, since both are `0x${string}`.
 */
export type EIP1898BlockTag =
	| EIP1193BlockTag
	| EIP1193DATA // bare block hash, per `BlockNumberOrTagOrHash`
	| {blockHash: EIP1193DATA; requireCanonical?: boolean} // EIP-1898
	| {blockNumber: EIP1193QUANTITY}; // EIP-1898

// ------------------------------------------------------------------------------------------------
// FEES
// ------------------------------------------------------------------------------------------------

/**
 * Result of `eth_feeHistory`.
 *
 * `gasUsedRatio` / `blobGasUsedRatio` are raw JSON floats (`0.945886...`), NOT hex quantities.
 * `reward` is only returned when `rewardPercentiles` was supplied in the request.
 */
export type EIP1193FeeHistory = {
	/** Lowest numbered block of the returned range. */
	oldestBlock: EIP1193QUANTITY;
	/** One entry per returned block, PLUS one for the next block after the newest. */
	baseFeePerGas: EIP1193QUANTITY[];
	/** Ratio of gasUsed to gasLimit, as a float between 0 and 1. */
	gasUsedRatio: number[];
	/** EIP-4844. Same "+1 entry" rule as `baseFeePerGas`. Absent on pre-Cancun clients. */
	baseFeePerBlobGas?: EIP1193QUANTITY[];
	/** EIP-4844, as a float between 0 and 1. Absent on pre-Cancun clients. */
	blobGasUsedRatio?: number[];
	/** Only present when `rewardPercentiles` was passed. Outer array: blocks. Inner: percentiles. */
	reward?: EIP1193QUANTITY[][];
};

// ------------------------------------------------------------------------------------------------
// ACCESS LISTS / AUTHORIZATIONS
// ------------------------------------------------------------------------------------------------

export type EIP1193AccessListEntry = {address: EIP1193Account; storageKeys: EIP1193DATA[]};
export type EIP1193AccessList = EIP1193AccessListEntry[];

/** A single EIP-7702 authorization tuple, as returned inside a type `0x4` transaction. */
export type EIP1193Authorization = {
	chainId: EIP1193QUANTITY;
	address: EIP1193Account;
	nonce: EIP1193QUANTITY;
	yParity: EIP1193QUANTITY;
	r: EIP1193QUANTITY;
	s: EIP1193QUANTITY;
};
export type EIP1193AuthorizationList = EIP1193Authorization[];

// ------------------------------------------------------------------------------------------------
// TRANSACTIONS (as returned by the node)
// ------------------------------------------------------------------------------------------------

/** Fields a node attaches to a transaction on top of the signed transaction itself. */
type EIP1193TransactionContext = {
	/** `null` while the transaction is still pending. */
	blockHash: EIP1193DATA | null;
	/** `null` while the transaction is still pending. */
	blockNumber: EIP1193QUANTITY | null;
	/** `null` while the transaction is still pending. */
	transactionIndex: EIP1193QUANTITY | null;
	/**
	 * Timestamp of the block this transaction is in.
	 * Added to `TransactionInfo` by execution-apis; not emitted by every client yet, so treat
	 * `undefined` as "this node does not provide it" and fall back rather than defaulting to 0.
	 */
	blockTimestamp?: EIP1193QUANTITY;
	hash: EIP1193DATA;
	from: EIP1193Account;
	/** `null` for a contract-creation transaction. */
	to: EIP1193Account | null;
	gas: EIP1193QUANTITY;
	input: EIP1193DATA;
	nonce: EIP1193QUANTITY;
	value: EIP1193QUANTITY;
	r: EIP1193QUANTITY;
	s: EIP1193QUANTITY;
};

/** Legacy (pre EIP-2718) signature: `v` carries the parity, EIP-155-encoded with the chain id. */
type EIP1193LegacySignature = {
	v: EIP1193QUANTITY;
	yParity?: never;
};

/** Typed-transaction signature: `yParity` is authoritative, `v` is a deprecated alias. */
type EIP1193TypedSignature = {
	yParity: EIP1193QUANTITY;
	/** @deprecated Provided for backwards compatibility. Use `yParity`. */
	v?: EIP1193QUANTITY;
};

export type EIP1193TransactionType0 = EIP1193TransactionContext &
	EIP1193LegacySignature & {
		/** Omitted by some clients for legacy transactions. */
		type?: '0x0';
		gasPrice: EIP1193QUANTITY;
		/** Present only for EIP-155 replay-protected legacy transactions. */
		chainId?: EIP1193ChainId;
	};

/** EIP-2930 access-list transaction. */
export type EIP1193TransactionType1 = EIP1193TransactionContext &
	EIP1193TypedSignature & {
		type: '0x1';
		chainId: EIP1193ChainId;
		gasPrice: EIP1193QUANTITY;
		accessList: EIP1193AccessList;
	};

/** EIP-1559 fee-market transaction. */
export type EIP1193TransactionType2 = EIP1193TransactionContext &
	EIP1193TypedSignature & {
		type: '0x2';
		chainId: EIP1193ChainId;
		accessList: EIP1193AccessList;
		maxFeePerGas: EIP1193QUANTITY;
		maxPriorityFeePerGas: EIP1193QUANTITY;
		/** @deprecated The effective gas price. Prefer `effectiveGasPrice` on the receipt. */
		gasPrice?: EIP1193QUANTITY;
	};

/** EIP-4844 blob transaction. Cannot be a contract creation, so `to` is never `null`. */
export type EIP1193TransactionType3 = Omit<EIP1193TransactionContext, 'to'> &
	EIP1193TypedSignature & {
		type: '0x3';
		to: EIP1193Account;
		chainId: EIP1193ChainId;
		accessList: EIP1193AccessList;
		maxFeePerGas: EIP1193QUANTITY;
		maxPriorityFeePerGas: EIP1193QUANTITY;
		maxFeePerBlobGas: EIP1193QUANTITY;
		blobVersionedHashes: EIP1193DATA[];
		/** @deprecated The effective gas price. Prefer `effectiveGasPrice` on the receipt. */
		gasPrice?: EIP1193QUANTITY;
	};

/** EIP-7702 set-code transaction. Cannot be a contract creation, so `to` is never `null`. */
export type EIP1193TransactionType4 = Omit<EIP1193TransactionContext, 'to'> &
	EIP1193TypedSignature & {
		type: '0x4';
		to: EIP1193Account;
		chainId: EIP1193ChainId;
		accessList: EIP1193AccessList;
		maxFeePerGas: EIP1193QUANTITY;
		maxPriorityFeePerGas: EIP1193QUANTITY;
		authorizationList: EIP1193AuthorizationList;
		/** @deprecated The effective gas price. Prefer `effectiveGasPrice` on the receipt. */
		gasPrice?: EIP1193QUANTITY;
	};

export type EIP1193Transaction =
	| EIP1193TransactionType0
	| EIP1193TransactionType1
	| EIP1193TransactionType2
	| EIP1193TransactionType3
	| EIP1193TransactionType4;

// ------------------------------------------------------------------------------------------------
// TRANSACTIONS (as submitted by the caller)
// ------------------------------------------------------------------------------------------------

type BaseEIP1193TransactionData = {
	from: EIP1193Account;
	/** Omit for a contract creation. */
	to?: EIP1193Account;
	gas?: EIP1193QUANTITY;
	value?: EIP1193QUANTITY;
	/** The calldata. `execution-apis` names this field `input`; both spellings are accepted. */
	data?: EIP1193DATA;
	/** Alias of `data`, matching the `execution-apis` `GenericTransaction` schema. */
	input?: EIP1193DATA;
	nonce?: EIP1193QUANTITY;
};

export type EIP1193LegacyTransactionData = BaseEIP1193TransactionData & {
	type?: '0x0';
	gasPrice?: EIP1193QUANTITY;
};

export type EIP1193TransactionDataOfType1 = BaseEIP1193TransactionData & {
	type: '0x1';
	chainId?: EIP1193ChainId;
	accessList?: EIP1193AccessList;
	gasPrice?: EIP1193QUANTITY;
};

export type EIP1193TransactionDataOfType2 = BaseEIP1193TransactionData & {
	type: '0x2';
	chainId?: EIP1193ChainId;
	accessList?: EIP1193AccessList;
	maxFeePerGas?: EIP1193QUANTITY;
	maxPriorityFeePerGas?: EIP1193QUANTITY;
};

/** EIP-4844 blob transaction. */
export type EIP1193TransactionDataOfType3 = BaseEIP1193TransactionData & {
	type: '0x3';
	to: EIP1193Account;
	chainId?: EIP1193ChainId;
	accessList?: EIP1193AccessList;
	maxFeePerGas?: EIP1193QUANTITY;
	maxPriorityFeePerGas?: EIP1193QUANTITY;
	maxFeePerBlobGas?: EIP1193QUANTITY;
	blobVersionedHashes?: EIP1193DATA[];
	blobs?: EIP1193DATA[];
	commitments?: EIP1193DATA[];
	proofs?: EIP1193DATA[];
};

/** EIP-7702 set-code transaction. */
export type EIP1193TransactionDataOfType4 = BaseEIP1193TransactionData & {
	type: '0x4';
	to: EIP1193Account;
	chainId?: EIP1193ChainId;
	accessList?: EIP1193AccessList;
	maxFeePerGas?: EIP1193QUANTITY;
	maxPriorityFeePerGas?: EIP1193QUANTITY;
	authorizationList?: EIP1193AuthorizationList;
};

export type EIP1193TransactionData =
	| EIP1193LegacyTransactionData
	| EIP1193TransactionDataOfType1
	| EIP1193TransactionDataOfType2
	| EIP1193TransactionDataOfType3
	| EIP1193TransactionDataOfType4;

/**
 * The `GenericTransaction` object accepted by `eth_call`, `eth_estimateGas` and
 * `eth_createAccessList`. Every field is optional: a call with only `data` is a
 * contract-creation simulation, and a call with only `to` is a plain read.
 */
export type EIP1193CallParam = {
	type?: EIP1193QUANTITY;
	nonce?: EIP1193QUANTITY;
	from?: EIP1193Account;
	to?: EIP1193Account | null;
	gas?: EIP1193QUANTITY;
	value?: EIP1193QUANTITY;
	/** The calldata. `execution-apis` names this field `input`; both spellings are accepted. */
	data?: EIP1193DATA;
	/** Alias of `data`, matching the `execution-apis` `GenericTransaction` schema. */
	input?: EIP1193DATA;
	gasPrice?: EIP1193QUANTITY;
	maxFeePerGas?: EIP1193QUANTITY;
	maxPriorityFeePerGas?: EIP1193QUANTITY;
	maxFeePerBlobGas?: EIP1193QUANTITY;
	accessList?: EIP1193AccessList;
	blobVersionedHashes?: EIP1193DATA[];
	blobs?: EIP1193DATA[];
	commitments?: EIP1193DATA[];
	proofs?: EIP1193DATA[];
	chainId?: EIP1193ChainId;
	authorizationList?: EIP1193AuthorizationList;
};

/** Per-account entry of the `eth_call` / `eth_estimateGas` state override set. */
export type EIP1193AccountOverride = {
	balance?: EIP1193QUANTITY;
	nonce?: EIP1193QUANTITY;
	code?: EIP1193DATA;
	/** Replaces the account's entire storage. Mutually exclusive with `stateDiff`. */
	state?: {[slot: EIP1193DATA]: EIP1193DATA};
	/** Overrides individual slots. Mutually exclusive with `state`. */
	stateDiff?: {[slot: EIP1193DATA]: EIP1193DATA};
	movePrecompileToAddress?: EIP1193Account;
};

/**
 * Optional third parameter of `eth_call` / `eth_estimateGas`.
 * Not part of `execution-apis` yet, but implemented by go-ethereum, erigon, reth, anvil and hardhat.
 */
export type EIP1193StateOverride = {[address: EIP1193Account]: EIP1193AccountOverride};

// ------------------------------------------------------------------------------------------------
// BLOCKS
// ------------------------------------------------------------------------------------------------

export type EIP1193Withdrawal = {
	index: EIP1193QUANTITY;
	validatorIndex: EIP1193QUANTITY;
	address: EIP1193Account;
	amount: EIP1193QUANTITY;
};

/** A block header, i.e. a block without its body. This is what a `newHeads` subscription pushes. */
export type EIP1193BlockHeader = {
	number: EIP1193QUANTITY;
	hash: EIP1193DATA;
	parentHash: EIP1193DATA;
	nonce: EIP1193DATA;
	mixHash: EIP1193DATA;
	sha3Uncles: EIP1193DATA;
	logsBloom: EIP1193DATA;
	transactionsRoot: EIP1193DATA;
	stateRoot: EIP1193DATA;
	receiptsRoot: EIP1193DATA;
	miner: EIP1193Account;
	/** Always `0x0` after the merge, but still emitted by every client. */
	difficulty: EIP1193QUANTITY;
	/**
	 * @deprecated Removed from `execution-apis` and no longer emitted by go-ethereum (>= 1.14).
	 * Do not rely on it being present.
	 */
	totalDifficulty?: EIP1193QUANTITY;
	extraData: EIP1193DATA;
	gasLimit: EIP1193QUANTITY;
	gasUsed: EIP1193QUANTITY;
	timestamp: EIP1193QUANTITY;
	/** EIP-1559. Absent on pre-London blocks. */
	baseFeePerGas?: EIP1193QUANTITY;
	/** EIP-4895. Absent on pre-Shanghai blocks. */
	withdrawalsRoot?: EIP1193DATA;
	/** EIP-4844. Absent on pre-Cancun blocks. */
	blobGasUsed?: EIP1193QUANTITY;
	/** EIP-4844. Absent on pre-Cancun blocks. */
	excessBlobGas?: EIP1193QUANTITY;
	/** EIP-4788. Absent on pre-Cancun blocks. */
	parentBeaconBlockRoot?: EIP1193DATA;
	/** EIP-7685. Absent on pre-Prague blocks. */
	requestsHash?: EIP1193DATA;
};

/**
 * A block as returned by `eth_getBlockByHash` / `eth_getBlockByNumber` with the hydrated flag
 * set to `false` (or omitted): `transactions` is a list of transaction HASHES.
 */
export type EIP1193Block = EIP1193BlockHeader & {
	size: EIP1193QUANTITY;
	transactions: EIP1193DATA[];
	uncles: EIP1193DATA[];
	/** EIP-4895. Absent on pre-Shanghai blocks. */
	withdrawals?: EIP1193Withdrawal[];
};

/**
 * A block as returned with the hydrated flag set to `true`: `transactions` holds the full
 * transaction objects.
 */
export type EIP1193BlockWithTransactions = Omit<EIP1193Block, 'transactions'> & {
	transactions: EIP1193Transaction[];
};

type EIP1193PendingBlockOverrides = {
	number: null;
	hash: null;
	nonce: null;
	logsBloom: null;
};

export type EIP1193PendingBlock = Omit<EIP1193Block, keyof EIP1193PendingBlockOverrides> & EIP1193PendingBlockOverrides;

export type EIP1193PendingBlockWithTransactions = Omit<EIP1193PendingBlock, 'transactions'> & {
	transactions: EIP1193Transaction[];
};

// ------------------------------------------------------------------------------------------------
// LOGS & RECEIPTS
// ------------------------------------------------------------------------------------------------

export type EIP1193Log = {
	removed: boolean;
	logIndex: EIP1193QUANTITY | null;
	transactionIndex: EIP1193QUANTITY | null;
	transactionHash: EIP1193DATA | null;
	blockHash: EIP1193DATA | null;
	blockNumber: EIP1193QUANTITY | null;
	/**
	 * The timestamp of the block this log is in.
	 *
	 * Added to the `Log` schema by ethereum/execution-apis#639. It is OPTIONAL in
	 * the spec (the schema's only required field is `transactionHash`) and it is
	 * optional here for the same reason: it exists to save the extra
	 * `eth_getBlockByHash` round-trip per block, but not every node emits it yet.
	 * Served by go-ethereum (>= 1.16.0), reth, besu, erigon, anvil and ethereumjs;
	 * notably NOT by Hardhat's EDR as of hardhat 3.14.0.
	 *
	 * Consumers must treat `undefined` as "this node does not provide it" and fall
	 * back, rather than defaulting it to 0: a missing timestamp is recoverable, a
	 * wrong one is not.
	 */
	blockTimestamp?: EIP1193QUANTITY;
	address: EIP1193Account;
	data: EIP1193DATA;
	topics: EIP1193DATA[];
};

export type EIP1193TransactionReceipt = {
	transactionHash: EIP1193DATA;
	transactionIndex: EIP1193QUANTITY;
	blockHash: EIP1193DATA;
	blockNumber: EIP1193QUANTITY;
	from: EIP1193Account;
	/** `null` for a contract-creation transaction. */
	to: EIP1193Account | null;
	cumulativeGasUsed: EIP1193QUANTITY;
	effectiveGasPrice: EIP1193QUANTITY;
	gasUsed: EIP1193QUANTITY;
	/** EIP-4844. Only present for blob transactions. */
	blobGasUsed?: EIP1193QUANTITY;
	/** EIP-4844. Only present for blob transactions. */
	blobGasPrice?: EIP1193QUANTITY;
	/** The address of the created contract, or `null` if this was not a contract creation. */
	contractAddress: EIP1193Account | null;
	logs: EIP1193Log[];
	logsBloom: EIP1193DATA;
	type: EIP1193QUANTITY;
	/**
	 * The post-transaction state root. Only present for transactions included BEFORE the
	 * Byzantium upgrade (2017), where it takes the place of `status`. Effectively never present
	 * on any chain in current use, which is why `status` is kept required here.
	 */
	root?: EIP1193DATA;
	/** `0x1` on success, `0x0` on failure. Present since Byzantium. */
	status: EIP1193QUANTITY;
};

/** The filter object accepted by `eth_getLogs`, `eth_newFilter` and `eth_subscribe('logs', ...)`. */
export type EIP1193LogsParam = {
	fromBlock?: EIP1193BlockTag;
	toBlock?: EIP1193BlockTag;
	address?: EIP1193Account | EIP1193AddressList | null;
	topics?: (EIP1193DATA | EIP1193DATA[] | null)[] | null;
	/**
	 * Restricts the query to a single block. Mutually exclusive with `fromBlock`/`toBlock`.
	 *
	 * NOTE the casing: it is `blockHash`, not `blockhash`. Both `execution-apis` (`filter.yaml`)
	 * and go-ethereum (`FilterCriteria.UnmarshalJSON`) use camelCase.
	 */
	blockHash?: EIP1193DATA;
};

// ------------------------------------------------------------------------------------------------
// PROOFS & SYNC
// ------------------------------------------------------------------------------------------------

export type EIP1193StorageProof = {
	key: EIP1193DATA;
	value: EIP1193QUANTITY;
	proof: EIP1193DATA[];
};

export type EIP1193AccountProof = {
	address: EIP1193Account;
	accountProof: EIP1193DATA[];
	balance: EIP1193QUANTITY;
	codeHash: EIP1193DATA;
	nonce: EIP1193QUANTITY;
	storageHash: EIP1193DATA;
	storageProof: EIP1193StorageProof[];
};

export type EIP1193SyncingStatus = {
	startingBlock: EIP1193QUANTITY;
	currentBlock: EIP1193QUANTITY;
	highestBlock: EIP1193QUANTITY;
};

/**
 * Payload pushed by a `syncing` subscription.
 *
 * NOTE: unlike the `eth_syncing` RESULT, go-ethereum pushes plain JSON numbers here, not hex
 * quantities. That asymmetry is in the client, not a mistake in these types.
 */
export type EIP1193SyncingSubscriptionStatus = {
	syncing: boolean;
	status: {
		startingBlock: number;
		currentBlock: number;
		highestBlock: number;
		pulledStates: number;
		knownStates: number;
	};
};

// ------------------------------------------------------------------------------------------------
// TRACING
// ------------------------------------------------------------------------------------------------

export type EIP1193StructLog = {
	pc: number;
	op: string;
	gas: number;
	gasCost: number;
	depth: number;
	error?: string;
	stack?: EIP1193DATA[];
	memory?: EIP1193DATA[];
	storage?: {[slot: string]: EIP1193DATA};
	refund?: number;
};

export type EIP1193TracedTransaction = {
	failed: boolean;
	gas: number;
	returnValue: string;
	structLogs: EIP1193StructLog[];
};

export type EIP1193TraceConfig = {
	tracer?: string;
	tracerConfig?: {[key: string]: unknown};
	timeout?: string;
	disableStack?: boolean;
	disableStorage?: boolean;
	enableMemory?: boolean;
	enableReturnData?: boolean;
};

// ------------------------------------------------------------------------------------------------
// SIGNING
// ------------------------------------------------------------------------------------------------

export type EIP712TypedDataField = {name: string; type: string};

export type EIP712Domain = {
	name?: string;
	version?: string;
	chainId?: number | EIP1193ChainId;
	verifyingContract?: EIP1193Account;
	salt?: EIP1193DATA;
};

/** An EIP-712 typed-data payload, as passed to `eth_signTypedData_v4`. */
export type EIP1193TypedData = {
	types: {[typeName: string]: EIP712TypedDataField[]};
	primaryType: string;
	domain: EIP712Domain;
	message: {[field: string]: any};
};

/**
 * The typed-data parameter of `eth_signTypedData_v3` / `eth_signTypedData_v4`.
 *
 * MetaMask's canonical form is a JSON STRING (`JSON.stringify(typedData)`); other wallets and
 * most libraries accept the object directly. Both are allowed here.
 */
export type EIP1193TypedSignatureParam = EIP1193TypedData | string;

/** A single field of the legacy V1 `eth_signTypedData` payload. */
export type EIP1193TypedDataV1Field = {
	name: string;
	type: string;
	value: any;
};

/**
 * The legacy V1 `eth_signTypedData` payload: a flat ARRAY of fields, not an EIP-712 object.
 * Note that V1 also takes its parameters in the opposite order to v3/v4.
 */
export type EIP1193TypedDataV1 = EIP1193TypedDataV1Field[];

// ------------------------------------------------------------------------------------------------
// WALLET METHOD PARAMS (EIP-3085 / 3326 / 747 / 2255 / 5792)
// ------------------------------------------------------------------------------------------------

/** EIP-3085. Only `chainId` is required by the EIP, but wallets in practice require more. */
export type EIP1193AddChainParam = {
	chainId: EIP1193ChainId;
	rpcUrls?: string[];
	blockExplorerUrls?: string[];
	chainName?: string;
	iconUrls?: string[];
	nativeCurrency?: {
		name: string;
		symbol: string;
		decimals: number;
	};
};

/** EIP-3326. */
export type EIP1193SwitchChainParam = {chainId: EIP1193ChainId};

/** EIP-747. `type` is open-ended by design; the three below are what wallets ship today. */
export type EIP1193WatchAssetParam = {
	type: 'ERC20' | 'ERC721' | 'ERC1155' | (string & {});
	options: {
		address: EIP1193Account;
		symbol?: string;
		decimals?: number;
		image?: string;
		tokenId?: string;
		chainId?: number;
	};
};

/** EIP-2255 permission request: `{[methodName]: {[caveatName]: value}}`. */
export type EIP1193PermissionRequest = {
	[methodName: string]: {[caveatName: string]: any};
};

export type EIP1193Caveat = {
	type: string;
	value: any;
};

/** EIP-2255 permission, as returned by `wallet_getPermissions`. */
export type EIP1193Permission = {
	invoker: string;
	parentCapability: string;
	caveats: EIP1193Caveat[];
	date?: number;
};

/** EIP-2255 permission, as returned by `wallet_requestPermissions`. */
export type EIP1193RequestedPermission = {
	parentCapability: string;
	date?: number;
};

/** EIP-5792 capability entry. `optional: true` lets a wallet ignore one it does not support. */
export type EIP1193Capability = {
	optional?: boolean;
	[key: string]: unknown;
};

/** EIP-5792 `wallet_sendCalls` parameter. */
export type EIP1193SendCallsParam = {
	version: string;
	id?: string;
	from?: EIP1193Account;
	chainId: EIP1193ChainId;
	atomicRequired: boolean;
	calls: {
		to?: EIP1193Account;
		data?: EIP1193DATA;
		value?: EIP1193QUANTITY;
		capabilities?: {[name: string]: EIP1193Capability};
	}[];
	capabilities?: {[name: string]: EIP1193Capability};
};

export type EIP1193SendCallsResult = {
	id: string;
	capabilities?: {[name: string]: any};
};

/**
 * EIP-5792 batch status codes.
 * 100 pending, 200 confirmed, 400 offchain failure, 500 fully reverted, 600 partially reverted.
 */
export type EIP1193CallsStatusCode = 100 | 200 | 400 | 500 | 600 | (number & {});

export type EIP1193CallsStatus = {
	version: string;
	id: EIP1193DATA;
	chainId: EIP1193ChainId;
	status: EIP1193CallsStatusCode;
	atomic: boolean;
	/** A strict subset of `eth_getTransactionReceipt`, restricted to the submitted calls. */
	receipts?: {
		logs: {address: EIP1193Account; data: EIP1193DATA; topics: EIP1193DATA[]}[];
		status: EIP1193QUANTITY;
		blockHash: EIP1193DATA;
		blockNumber: EIP1193QUANTITY;
		gasUsed: EIP1193QUANTITY;
		transactionHash: EIP1193DATA;
	}[];
	capabilities?: {[name: string]: any};
};

/** EIP-5792 `wallet_getCapabilities` result, keyed by chain id. */
export type EIP1193Capabilities = {[chainId: EIP1193ChainId]: {[name: string]: any}};

// ------------------------------------------------------------------------------------------------
// ERRORS
// ------------------------------------------------------------------------------------------------

/** EIP-1193 provider error codes. */
export type EIP1193ProviderErrorCode =
	/** The user rejected the request. */
	| 4001
	/** The requested method and/or account has not been authorized by the user. */
	| 4100
	/** The Provider does not support the requested method. */
	| 4200
	/** The Provider is disconnected from all chains. */
	| 4900
	/** The Provider is not connected to the requested chain. */
	| 4901;

/** JSON-RPC 2.0 and EIP-1474 error codes. */
export type EIP1193RpcErrorCode =
	| -32700 // Parse error
	| -32600 // Invalid request
	| -32601 // Method not found
	| -32602 // Invalid params
	| -32603 // Internal error
	| -32000 // Invalid input
	| -32001 // Resource not found
	| -32002 // Resource unavailable (MetaMask: a request is already pending)
	| -32003 // Transaction rejected
	| -32004 // Method not supported
	| -32005 // Limit exceeded
	| -32006 // JSON-RPC version not supported
	| 3; // Execution reverted; the raw revert data is in `data`

export type EIP1193ErrorCode = EIP1193ProviderErrorCode | EIP1193RpcErrorCode;

export interface EIP1193ProviderRpcError extends Error {
	/** `EIP1193ErrorCode` lists the standardized values; any integer is legal. */
	code: EIP1193ErrorCode | (number & {});
	data?: unknown;
}

/**
 * @deprecated `wallet_addEthereumChain` resolves with `null` and THROWS on failure (EIP-3085),
 * so there is no error-shaped result to type. Catch an {@link EIP1193ProviderRpcError} instead.
 */
export type EIP1193AddChainError = EIP1193ProviderRpcError;

/**
 * @deprecated `wallet_switchEthereumChain` resolves with `null` and THROWS on failure (EIP-3326),
 * so there is no error-shaped result to type. Catch an {@link EIP1193ProviderRpcError} instead.
 */
export type EIP1193SwitchChainError = EIP1193ProviderRpcError;

// ------------------------------------------------------------------------------------------------
// EVENTS
// ------------------------------------------------------------------------------------------------

export interface EIP1193ConnectInfoMessage {
	readonly chainId: EIP1193ChainId;
}

/** Payloads a subscription can push, depending on the subscription kind. */
export type EIP1193SubscriptionResult =
	| EIP1193BlockHeader // newHeads
	| EIP1193Log // logs
	| EIP1193DATA // newPendingTransactions (hash form)
	| EIP1193Transaction // newPendingTransactions (full form)
	| EIP1193TransactionReceipt[] // transactionReceipts
	| EIP1193SyncingSubscriptionStatus; // syncing

/** The `eth_subscription` message, the only `message` payload standardized by EIP-1193. */
export type EIP1193SubscriptionMessage = {
	readonly type: 'eth_subscription';
	readonly data: {
		readonly subscription: EIP1193DATA;
		readonly result: EIP1193SubscriptionResult;
	};
};

/** Any other, non-standard message a provider may choose to emit. */
export type EIP1193UnknownMessage = {
	readonly type: string;
	readonly data: unknown;
};

/**
 * The `message` event payload.
 *
 * This is deliberately NOT `EIP1193SubscriptionMessage | EIP1193UnknownMessage`. A union member
 * typed `{type: string; data: unknown}` absorbs the literal member, so
 * `if (m.type === 'eth_subscription')` would leave `m.data` as `unknown` and the discriminated
 * union would buy you nothing. `eth_subscription` is the only standardized type, so it is the
 * default here.
 *
 * If your provider emits non-standard message types, widen at the call site. That is allowed,
 * because a listener accepting a wider parameter is assignable to a narrower listener:
 *
 *     provider.on('message', (m: EIP1193AnyMessage) => { ... });
 */
export type EIP1193Message = EIP1193SubscriptionMessage;

/** The honest, unnarrowable union. Opt in when you need to handle non-standard messages. */
export type EIP1193AnyMessage = EIP1193SubscriptionMessage | EIP1193UnknownMessage;

/** @deprecated Renamed to {@link EIP1193SubscriptionMessage}. */
export type EIP1193KnownSubscriptionMessage = EIP1193SubscriptionMessage;

/**
 * @deprecated Renamed to {@link EIP1193SubscriptionMessage}. The previous "known" / "unknown"
 * split described the same `eth_subscription` shape twice and never narrowed.
 */
export type EIP1193UnknownSubscriptionMessage = EIP1193SubscriptionMessage;

/** The return value of a listener is ignored by the provider. */
type Listener<Message> = (message: Message) => unknown;

// ------------------------------------------------------------------------------------------------
// METHOD GROUPS
// ------------------------------------------------------------------------------------------------
//
// Groups are split by WHO can serve a method, so a provider type never claims a method its
// implementation does not have:
//
//   ClientMethods           - client/network identity. Browser wallets AND nodes.
//   ReadMethods             - chain reads. Browser wallets AND nodes.
//   WriteMethods            - raw submission. Browser wallets AND nodes.
//   SignerMethods           - anything needing a key. Wallets, and nodes with unlocked accounts.
//   ConnectedAccountMethods - needs a key AND a currently selected account.
//   WalletOnlyMethods       - the wallet-namespaced UX methods. Browser wallets only.
//   NodeOnlyReadMethods     - node introspection and heavy reads. JSON-RPC endpoints only.
//   FilterMethods           - poll-based log filters. Stateful transports.
//   SubscriptionMethods     - push subscriptions. Browser wallets AND WS/IPC nodes, but NOT
//                             plain HTTP endpoints.
//   LegacyNodeMethods       - pre-merge leftovers, removed from execution-apis.
//   DebugOnlyMethods        - the debug namespace.
//
// ------------------------------------------------------------------------------------------------

/** Client and network identity. Served by browser wallets as well as nodes. */
export type ClientMethods = {
	eth_chainId: {result: EIP1193ChainId};
	/**
	 * The network id as a DECIMAL string (`'1'`), NOT a hex quantity.
	 * `execution-apis` types this as `uintDecimal`.
	 */
	net_version: {result: string};
	web3_clientVersion: {result: string};
	web3_sha3: {params: [EIP1193DATA]; result: EIP1193DATA};
};

/** Chain reads available on both a browser wallet and a plain JSON-RPC endpoint. */
export type ReadMethods = {
	eth_blockNumber: {result: EIP1193QUANTITY};

	eth_gasPrice: {result: EIP1193QUANTITY};
	eth_maxPriorityFeePerGas: {result: EIP1193QUANTITY};
	/** EIP-4844. */
	eth_blobBaseFee: {result: EIP1193QUANTITY};
	eth_feeHistory: {
		params: [blockCount: EIP1193QUANTITY, newestBlock: EIP1193BlockTag, rewardPercentiles: number[]];
		result: EIP1193FeeHistory;
	};

	eth_getBalance: {params: [EIP1193Account, EIP1898BlockTag?]; result: EIP1193QUANTITY};
	eth_getCode: {params: [EIP1193Account, EIP1898BlockTag?]; result: EIP1193DATA};
	eth_getStorageAt: {params: [EIP1193Account, EIP1193DATA, EIP1898BlockTag?]; result: EIP1193DATA};
	eth_getTransactionCount: {params: [EIP1193Account, EIP1898BlockTag?]; result: EIP1193QUANTITY};

	eth_call: {params: [EIP1193CallParam, EIP1898BlockTag?, EIP1193StateOverride?]; result: EIP1193DATA};
	/** Note: unlike `eth_call`, the block parameter here does NOT accept a block hash. */
	eth_estimateGas: {params: [EIP1193CallParam, EIP1193BlockTag?, EIP1193StateOverride?]; result: EIP1193QUANTITY};

	/**
	 * The second parameter selects the shape of the result, so these are two separate call
	 * signatures rather than one signature returning a union. Pass a LITERAL `true` / `false`
	 * (a value of type `boolean` cannot be narrowed and will not match either signature).
	 */
	eth_getBlockByHash:
		| {params: [EIP1193DATA, false?]; result: EIP1193Block | null}
		| {params: [EIP1193DATA, true]; result: EIP1193BlockWithTransactions | null};
	eth_getBlockByNumber:
		| {params: [EIP1193BlockTag, false?]; result: EIP1193Block | null}
		| {params: [EIP1193BlockTag, true]; result: EIP1193BlockWithTransactions | null};

	eth_getBlockTransactionCountByHash: {params: [EIP1193DATA]; result: EIP1193QUANTITY | null};
	eth_getBlockTransactionCountByNumber: {params: [EIP1193BlockTag]; result: EIP1193QUANTITY | null};

	eth_getTransactionByHash: {params: [EIP1193DATA]; result: EIP1193Transaction | null};
	eth_getTransactionByBlockHashAndIndex: {params: [EIP1193DATA, EIP1193QUANTITY]; result: EIP1193Transaction | null};
	eth_getTransactionByBlockNumberAndIndex: {
		params: [EIP1193BlockTag, EIP1193QUANTITY];
		result: EIP1193Transaction | null;
	};

	eth_getTransactionReceipt: {params: [EIP1193DATA]; result: EIP1193TransactionReceipt | null};
	eth_getBlockReceipts: {params: [EIP1898BlockTag]; result: EIP1193TransactionReceipt[] | null};

	eth_getLogs: {params: [EIP1193LogsParam]; result: EIP1193Log[]};
};

/** Node introspection and heavy reads. Browser wallets generally reject these. */
export type NodeOnlyReadMethods = {
	net_listening: {result: boolean};
	net_peerCount: {result: EIP1193QUANTITY};

	eth_syncing: {result: EIP1193SyncingStatus | false};
	eth_coinbase: {result: EIP1193Account};

	eth_getProof: {
		params: [EIP1193Account, EIP1193DATA[], EIP1898BlockTag?];
		result: EIP1193AccountProof;
	};
	eth_createAccessList: {
		params: [EIP1193CallParam, EIP1193BlockTag?];
		result: {accessList: EIP1193AccessList; gasUsed: EIP1193QUANTITY; error?: string};
	};
};

/**
 * Poll-based log filters. Stateful, so not available on naively load-balanced endpoints.
 * Served by browser wallets too (MetaMask ships `eth-json-rpc-filters`).
 */
export type FilterMethods = {
	eth_newFilter: {params: [EIP1193LogsParam]; result: EIP1193QUANTITY};
	eth_newBlockFilter: {result: EIP1193QUANTITY};
	eth_newPendingTransactionFilter: {result: EIP1193QUANTITY};
	eth_uninstallFilter: {params: [EIP1193QUANTITY]; result: boolean};
	/** Block/transaction hashes for block and pending-transaction filters, logs for log filters. */
	eth_getFilterChanges: {params: [EIP1193QUANTITY]; result: EIP1193DATA[] | EIP1193Log[]};
	eth_getFilterLogs: {params: [EIP1193QUANTITY]; result: EIP1193Log[]};
};

/**
 * Push subscriptions.
 *
 * Requires a transport that can deliver server-initiated notifications: WebSocket, IPC, or an
 * injected browser wallet with an internal event channel. NOT available over plain HTTP.
 * Browser wallets DO serve these (they are listed in MetaMask's own api-specs), and EIP-1193
 * specifies the `message` event precisely to carry their notifications, so they are part of the
 * default wallet surface.
 *
 * Notifications arrive through the `message` event as {@link EIP1193SubscriptionMessage}.
 */
export type SubscriptionMethods = {
	eth_subscribe:
		| {params: ['newHeads']; result: EIP1193DATA}
		| {params: ['logs', EIP1193LogsParam?]; result: EIP1193DATA}
		| {params: ['newPendingTransactions', boolean?]; result: EIP1193DATA}
		| {params: ['transactionReceipts', {transactionHashes?: EIP1193DATA[]}?]; result: EIP1193DATA}
		/** Not in execution-apis, but implemented by go-ethereum. */
		| {params: ['syncing']; result: EIP1193DATA};
	eth_unsubscribe: {params: [EIP1193DATA]; result: boolean};
};

/**
 * Pre-merge leftovers. Removed from `execution-apis`, still answered by some clients.
 * Uncles are always empty after the merge.
 */
export type LegacyNodeMethods = {
	/** @deprecated Removed from execution-apis. */
	eth_protocolVersion: {result: string};
	/** @deprecated Always `false` after the merge. */
	eth_mining: {result: boolean};
	/** @deprecated Always `0x0` after the merge. */
	eth_hashrate: {result: EIP1193QUANTITY};
	/** @deprecated Always `0x0` after the merge. */
	eth_getUncleCountByBlockHash: {params: [EIP1193DATA]; result: EIP1193QUANTITY | null};
	/** @deprecated Always `0x0` after the merge. */
	eth_getUncleCountByBlockNumber: {params: [EIP1193BlockTag]; result: EIP1193QUANTITY | null};
	/** @deprecated Always `null` after the merge. */
	eth_getUncleByBlockHashAndIndex: {params: [EIP1193DATA, EIP1193QUANTITY]; result: EIP1193Block | null};
	/** @deprecated Always `null` after the merge. */
	eth_getUncleByBlockNumberAndIndex: {params: [EIP1193BlockTag, EIP1193QUANTITY]; result: EIP1193Block | null};
};

/** Submission of an already-signed transaction. Needs no key. */
export type WriteMethods = {
	eth_sendRawTransaction: {params: [EIP1193DATA]; result: EIP1193DATA};
};

/** Anything that requires access to a private key. */
export type SignerMethods = {
	eth_accounts: {result: EIP1193Accounts};
	/** @deprecated Signs an arbitrary digest. Disabled by default in most wallets. Use `personal_sign`. */
	eth_sign: {params: [EIP1193Account, EIP1193DATA]; result: EIP1193DATA};
	eth_signTransaction: {params: [EIP1193TransactionData]; result: EIP1193DATA};

	/** Params are `[message, address]`, in that order. */
	personal_sign: {params: [EIP1193DATA, EIP1193Account]; result: EIP1193DATA};
	personal_ecRecover: {params: [EIP1193DATA, EIP1193DATA]; result: EIP1193Account};

	/**
	 * The legacy V1 API. Takes `[typedData, address]` -- the REVERSE of v3/v4 -- and a flat array
	 * of `{name, type, value}` fields rather than an EIP-712 object.
	 *
	 * @deprecated Use `eth_signTypedData_v4`.
	 */
	eth_signTypedData: {params: [EIP1193TypedDataV1 | string, EIP1193Account]; result: EIP1193DATA};
	/** @deprecated Does not handle arrays or nested structs correctly. Use `eth_signTypedData_v4`. */
	eth_signTypedData_v3: {params: [EIP1193Account, EIP1193TypedSignatureParam]; result: EIP1193DATA};
	eth_signTypedData_v4: {params: [EIP1193Account, EIP1193TypedSignatureParam]; result: EIP1193DATA};
};

/** Requires a key AND a currently selected account. */
export type ConnectedAccountMethods = {
	eth_sendTransaction: {params: [EIP1193TransactionData]; result: EIP1193DATA};
};

/** Wallet UX methods. Only a browser wallet can serve these; a JSON-RPC endpoint cannot. */
export type WalletOnlyMethods = {
	/** EIP-1102. */
	eth_requestAccounts: {result: EIP1193Accounts};

	/** EIP-3326. Resolves with `null` on success; failures are THROWN, not returned. */
	wallet_switchEthereumChain: {params: [EIP1193SwitchChainParam]; result: null};
	/** EIP-3085. Resolves with `null` on success; failures are THROWN, not returned. */
	wallet_addEthereumChain: {params: [EIP1193AddChainParam]; result: null};
	/** EIP-747. Returns `true` if the request was valid, regardless of the user's answer. */
	wallet_watchAsset: {params: [EIP1193WatchAssetParam]; result: boolean};

	/** EIP-2255. */
	wallet_getPermissions: {result: EIP1193Permission[]};
	/** EIP-2255. */
	wallet_requestPermissions: {params: [EIP1193PermissionRequest]; result: EIP1193RequestedPermission[]};
	/** Not standardized as an EIP, but implemented by MetaMask and others. */
	wallet_revokePermissions: {params: [EIP1193PermissionRequest]; result: null};

	/** EIP-5792. */
	wallet_sendCalls: {params: [EIP1193SendCallsParam]; result: EIP1193SendCallsResult};
	/** EIP-5792. */
	wallet_getCallsStatus: {params: [string]; result: EIP1193CallsStatus};
	/** EIP-5792. */
	wallet_showCallsStatus: {params: [string]; result: null};
	/** EIP-5792. */
	wallet_getCapabilities: {params: [EIP1193Account, EIP1193ChainId[]?]; result: EIP1193Capabilities};

	/** MetaMask-specific. Registers the site as the onboarding initiator. */
	wallet_registerOnboarding: {result: boolean};
	/** MetaMask-specific. Opens the QR scanner and returns the scanned value. */
	wallet_scanQRCode: {params: [string?]; result: string};

	/** @deprecated Removed from MetaMask. Was used for eth-sig-util encryption. */
	eth_getEncryptionPublicKey: {params: [EIP1193Account]; result: string};
	/** @deprecated Removed from MetaMask. Was used for eth-sig-util encryption. */
	eth_decrypt: {params: [EIP1193DATA, EIP1193Account]; result: string};
};

/** The `debug` namespace. Only exposed by nodes explicitly started with it enabled. */
export type DebugOnlyMethods = {
	debug_traceTransaction: {params: [EIP1193DATA, EIP1193TraceConfig?]; result: EIP1193TracedTransaction};
	debug_traceCall: {
		params: [EIP1193CallParam, EIP1898BlockTag?, EIP1193TraceConfig?];
		result: EIP1193TracedTransaction;
	};
};

// ------------------------------------------------------------------------------------------------
// METHOD SETS
// ------------------------------------------------------------------------------------------------

/**
 * Everything a browser wallet provider exposes. This is the surface EIP-1193 actually describes,
 * so it is also the default {@link Methods}.
 */
export type WalletMethods = ClientMethods &
	ReadMethods &
	FilterMethods &
	SubscriptionMethods &
	WriteMethods &
	SignerMethods &
	ConnectedAccountMethods &
	WalletOnlyMethods;

/**
 * Everything a full JSON-RPC node exposes. Note this includes the signer methods (a node with
 * unlocked accounts serves them) but NOT the `wallet_*` namespace, which has no meaning
 * server-side.
 */
export type NodeMethods = ClientMethods &
	ReadMethods &
	NodeOnlyReadMethods &
	FilterMethods &
	SubscriptionMethods &
	LegacyNodeMethods &
	WriteMethods &
	SignerMethods &
	ConnectedAccountMethods;

/**
 * The default method set: a browser wallet provider.
 *
 * If you are typing a plain JSON-RPC endpoint rather than a wallet, use {@link NodeMethods} /
 * {@link EIP1193NodeProvider}. If you genuinely want the union of everything, use
 * {@link AllMethods}.
 */
export type Methods = WalletMethods;

/**
 * A plain HTTP JSON-RPC endpoint: {@link NodeMethods} minus the push subscriptions, which need a
 * transport that can deliver server-initiated notifications.
 */
export type HttpNodeMethods = Omit<NodeMethods, keyof SubscriptionMethods>;

/**
 * The core every provider here serves: a browser wallet, a JSON-RPC node and a plain HTTP node.
 * The other sets are this core plus extras: {@link WalletMethods} adds subscriptions and the
 * `wallet_*` namespace, {@link NodeMethods} adds subscriptions, node introspection and the legacy
 * methods, and {@link HttpNodeMethods} is the node set without subscriptions.
 *
 * Use it to type a PARAMETER: code that only reads chain state, signs and broadcasts can then
 * accept whichever kind of provider the caller holds. Typing the parameter as the wallet surface
 * would reject a node provider (and the reverse), although the code needs neither side's extras.
 */
export type CoreMethods = ClientMethods &
	ReadMethods &
	FilterMethods &
	WriteMethods &
	SignerMethods &
	ConnectedAccountMethods;

/** Every method in this file, node and wallet and debug. Permissive; prefer a narrower set. */
export type AllMethods = NodeMethods & WalletMethods & DebugOnlyMethods;

// ------------------------------------------------------------------------------------------------
// TOOLS
// ------------------------------------------------------------------------------------------------

// taken from https://dev.to/bwca/deep-readonly-generic-in-typescript-4b04
type DeepReadonly<T> = Readonly<{
	[K in keyof T]: T[K] extends number | string | symbol // Is it a primitive? Then make it readonly
		? Readonly<T[K]>
		: // Is it an array of items? Then make the array readonly and the item as well
		T[K] extends Array<infer A>
		? Readonly<Array<DeepReadonly<A>>>
		: // It is some other object, make it readonly as well
		  DeepReadonly<T[K]>;
}>;

export type RPCRequestData = {params?: any; result?: any};

/** A method table. A value may be a UNION of entries, which becomes a union of overloads. */
export type RPCMethods = Record<string, RPCRequestData>;

export type RemoteRequestCallType<
	Method extends string,
	Value,
	Params extends any[] | Record<string, any> | undefined = undefined
> = [Params] extends [undefined]
	? {
			// no-param methods: `params` may be omitted, or sent as an empty array, which is what
			// most JSON-RPC transports do on the wire.
			request: (req: {method: Method; params?: readonly []}) => Promise<Value>;
	  }
	: [Params] extends [readonly []]
	? {
			request: (req: {method: Method; params?: readonly []}) => Promise<Value>;
	  }
	: {
			request: (req: {method: Method; params: DeepReadonly<Params>}) => Promise<Value>;
	  };

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Builds ONE call signature per entry.
 *
 * `Entry` is a naked type parameter, so this conditional DISTRIBUTES over a union of entries.
 * That is what makes a method declared as
 *
 *     eth_getBlockByNumber:
 *       | {params: [tag, false?]; result: Block | null}
 *       | {params: [tag, true]; result: BlockWithTransactions | null}
 *
 * produce two real overloads instead of collapsing into a single signature whose result is
 * `Block | BlockWithTransactions | null`. Indexing `T[Property]['result']` directly, as an
 * earlier version did, does NOT distribute and loses the narrowing.
 */
type MethodRequestCallType<Method extends string, Entry> = Entry extends RPCRequestData
	? RemoteRequestCallType<
			Method,
			Entry extends {result: any} ? Entry['result'] : undefined,
			Entry extends {params: any} ? Entry['params'] : undefined
	  >
	: never;

export type RequestUnion<T extends RPCMethods> = {
	[Property in keyof T]: MethodRequestCallType<Property extends string ? Property : never, T[Property]>;
}[keyof T];

// ------------------------------------------------------------------------------------------------
// PROVIDERS
// ------------------------------------------------------------------------------------------------

/**
 * Turns a method table into a `{request(...)}` object with one overload per method.
 *
 * There is deliberately NO `request(req: {method: string; ...})` catch-all overload here. A
 * catch-all matches every call, so a typo like `eth_blockNumbr` used to compile away into
 * `Promise<unknown>`, and every genuine mistake was reported as an unreadable "No overload
 * matches this call / Index signature for type 'string' is missing" against the catch-all
 * instead of against the method you actually called.
 *
 * To call a method that is not in the table, either extend the table:
 *
 *     type MyMethods = Methods & {my_method: {params: [string]; result: boolean}};
 *     declare const provider: RequestRPC<MyMethods> & EIP1193EventsProvider;
 *
 * or reach for the untyped escape hatch: {@link EIP1193GenericRequestProvider}.
 */
export type RequestRPC<T extends RPCMethods> = UnionToIntersection<RequestUnion<T>> & {
	// Diagnostic-only overload, deliberately LAST and deliberately unsatisfiable (`params: never`).
	// TypeScript reports the last overload when no overload matches, so this is what turns
	// "No overload matches this call" into a message that names the method you actually meant.
	request(req: {method: keyof T & string; params: never}): Promise<any>;
};

/** A browser wallet provider without the event emitter. */
export type EIP1193ProviderWithoutEvents = RequestRPC<Methods>;

/** A browser wallet provider (`window.ethereum`), without events. */
export type EIP1193WalletProvider = RequestRPC<WalletMethods>;

/** A browser wallet provider (`window.ethereum`), with events. */
export type EIP1193WindowWalletProvider = EIP1193WalletProvider & EIP1193EventsProvider;

/** A JSON-RPC node endpoint: node methods, no `wallet_*` namespace, no events. */
export type EIP1193NodeProvider = RequestRPC<NodeMethods>;

/** A node reached over plain HTTP, where `eth_subscribe` cannot work. */
export type EIP1193HttpNodeProvider = RequestRPC<HttpNodeMethods>;

/**
 * Accepts a wallet, a node or an HTTP node provider: see {@link CoreMethods}. Prefer it for a
 * parameter whose code only needs the methods all of them serve.
 */
export type EIP1193CoreProvider = RequestRPC<CoreMethods>;

/** Just the key-holding methods. */
export type EIP1193SignerProvider = RequestRPC<SignerMethods>;

/** A node provider with the `debug` namespace enabled. */
export type EIP1193DebugProvider = EIP1193NodeProvider & RequestRPC<DebugOnlyMethods>;

/** Every method in this file. Permissive; prefer a narrower provider type. */
export type EIP1193AllMethodsProvider = RequestRPC<AllMethods>;

export type EIP1193GenericRequest = {
	method: string;
	/** EIP-1193 allows either positional or named parameters. */
	params?: Readonly<unknown[]> | Record<string, unknown>;
};

/**
 * The untyped escape hatch, for proxies and for methods not covered by any table here.
 *
 * Intersecting this with a typed provider would reintroduce the catch-all overload problem
 * described on {@link RequestRPC}, so cast at the point of use instead:
 *
 *     await (provider as unknown as EIP1193GenericRequestProvider).request({method, params});
 */
export type EIP1193GenericRequestProvider = {
	request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(args: V): Promise<T>;
};

// ------------------------------------------------------------------------------------------------
// EVENTS PROVIDERS
// ------------------------------------------------------------------------------------------------
export interface EIP1193OnMessageProvider {
	on(eventName: 'message', listener: Listener<EIP1193Message>): this;
	removeListener(eventName: 'message', listener: Listener<EIP1193Message>): this;
}

export interface EIP1193OnConnectionProvider {
	on(eventName: 'connect', listener: Listener<EIP1193ConnectInfoMessage>): this;
	on(eventName: 'disconnect', listener: Listener<EIP1193ProviderRpcError>): this;
	removeListener(eventName: 'connect', listener: Listener<EIP1193ConnectInfoMessage>): this;
	removeListener(eventName: 'disconnect', listener: Listener<EIP1193ProviderRpcError>): this;
}

export interface EIP1193OnAccountsChangedProvider {
	on(eventName: 'accountsChanged', listener: Listener<EIP1193Accounts>): this;
	removeListener(eventName: 'accountsChanged', listener: Listener<EIP1193Accounts>): this;
}

export interface EIP1193OnChainChangedProvider {
	on(eventName: 'chainChanged', listener: Listener<EIP1193ChainId>): this;
	removeListener(eventName: 'chainChanged', listener: Listener<EIP1193ChainId>): this;
}

/**
 * The five events EIP-1193 requires, via the two methods it requires (`on` / `removeListener`).
 *
 * Wallets commonly also ship the rest of the Node `EventEmitter` surface (`once`, `off`,
 * `addListener`, `removeAllListeners`), but EIP-1193 does not mandate them, so they are not
 * declared here.
 */
export interface EIP1193EventsProvider {
	on(eventName: 'message', listener: Listener<EIP1193Message>): this;
	removeListener(eventName: 'message', listener: Listener<EIP1193Message>): this;

	on(eventName: 'connect', listener: Listener<EIP1193ConnectInfoMessage>): this;
	on(eventName: 'disconnect', listener: Listener<EIP1193ProviderRpcError>): this;
	removeListener(eventName: 'connect', listener: Listener<EIP1193ConnectInfoMessage>): this;
	removeListener(eventName: 'disconnect', listener: Listener<EIP1193ProviderRpcError>): this;

	on(eventName: 'accountsChanged', listener: Listener<EIP1193Accounts>): this;
	removeListener(eventName: 'accountsChanged', listener: Listener<EIP1193Accounts>): this;

	on(eventName: 'chainChanged', listener: Listener<EIP1193ChainId>): this;
	removeListener(eventName: 'chainChanged', listener: Listener<EIP1193ChainId>): this;
}

/** An EIP-1193 provider: what a browser wallet injects as `window.ethereum`. */
export interface EIP1193Provider extends EIP1193ProviderWithoutEvents, EIP1193EventsProvider {}
