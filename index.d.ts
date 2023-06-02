// ------------------------------------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------------------------------------
export type EIP1193Transaction = {
	blockHash: EIP1193DATA;
	blockNumber: EIP1193QUANTITY | null;
	from: EIP1193Account;
	gas: EIP1193QUANTITY;
	gasPrice: EIP1193QUANTITY;
	hash: EIP1193DATA;
	input: EIP1193DATA;
	nonce: EIP1193QUANTITY;
	to: EIP1193Account | null;
	transactionIndex: EIP1193QUANTITY | null;
	value: EIP1193QUANTITY;
	v: EIP1193QUANTITY;
	r: EIP1193QUANTITY;
	s: EIP1193QUANTITY;
};

type BaseEIP1193TransactionData = {
	from: EIP1193Account;
	to?: EIP1193Account;
	gas?: EIP1193QUANTITY;
	value?: EIP1193QUANTITY;
	data?: EIP1193DATA;
	nonce?: EIP1193QUANTITY;
};

export type EIP1193LegacyTransactionData = BaseEIP1193TransactionData & {
	type?: '0x0';
	gasPrice?: EIP1193QUANTITY;
};


export type EIP1193TransactionDataOfType1 = BaseEIP1193TransactionData & {
	type: "0x1",
	chainId?: EIP1193ChainId;
	accessList?: EIP1193AccessList;
	gasPrice?: EIP1193QUANTITY;
}


export type EIP1193AccessListEntry = { address: EIP1193Account; storageKeys: EIP1193DATA[] };
export type EIP1193AccessList = EIP1193AccessListEntry[];

export type EIP1193TransactionDataOfType2 = BaseEIP1193TransactionData & {
	type: "0x2",
	chainId?: EIP1193ChainId;
	accessList?: EIP1193AccessList;
	maxFeePerGas?: EIP1193QUANTITY;
	maxPriorityFeePerGas?: EIP1193QUANTITY
}

export type EIP1193TransactionData = EIP1193LegacyTransactionData | EIP1193TransactionDataOfType1 | EIP1193TransactionDataOfType2;

export type EIP1193SyncingStatus = {
	startingBlock: EIP1193QUANTITY;
	currentBlock: EIP1193QUANTITY;
	highestBlock: EIP1193QUANTITY;
};

export type EIP1193Block = {
	number: EIP1193QUANTITY;
	hash: EIP1193DATA;
	parentHash: EIP1193DATA;
	nonce: EIP1193DATA;
	sha3Uncles: EIP1193DATA;
	logsBloom: EIP1193DATA;
	transactionsRoot: EIP1193DATA;
	stateRoot: EIP1193DATA;
	receiptsRoot: EIP1193DATA;
	miner: EIP1193Account;
	difficulty: EIP1193QUANTITY;
	totalDifficulty: EIP1193QUANTITY;
	extraData: EIP1193DATA;
	size: EIP1193QUANTITY;
	gasLimit: EIP1193QUANTITY;
	gasUsed: EIP1193QUANTITY;
	timestamp: EIP1193QUANTITY;
	uncles: EIP1193DATA[];
};

export type EIP1193Log = {
	removed: boolean;
	logIndex: EIP1193QUANTITY | null;
	transactionIndex: EIP1193QUANTITY | null;
	transactionHash: EIP1193DATA | null;
	blockHash: EIP1193DATA | null;
	blockNumber: EIP1193QUANTITY | null;
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
	to: EIP1193Account;
	cumulativeGasUsed: EIP1193QUANTITY;
	effectiveGasPrice: EIP1193QUANTITY;
	gasUsed: EIP1193QUANTITY;
	contractAddress: EIP1193Account;
	logs: EIP1193Log[];
	logsBloom: EIP1193DATA;
	type: EIP1193DATA;
	root: EIP1193DATA;
	status: EIP1193QUANTITY;
};

export type EIP1193PendingBlock = EIP1193Block & {
	number: null;
	hash: null;
	nonce: null;
	logsBloom: null;
};

export type EIP1193BlockWithTransactions = EIP1193Block & {
	transactions: EIP1193Transaction[];
};

export type EIP1193PendingBlockWithTransactions = EIP1193PendingBlock & {
	transactions: EIP1193Transaction[];
};

type EIP1193BaseTransactionEIP1193DATA = {
	gas?: EIP1193QUANTITY;
	gasPrice?: EIP1193QUANTITY;
	value?: EIP1193QUANTITY;
	data?: EIP1193DATA;
	nonce?: EIP1193QUANTITY;
};
export type EIP1193NormalTransactionEIP1193DATA =
	EIP1193BaseTransactionEIP1193DATA & {
		from: EIP1193Account;
		to: EIP1193Account;
	};

export type EIP1193TransactionContractCreationEIP1193DATA =
	EIP1193BaseTransactionEIP1193DATA & {
		from: EIP1193Account;
		data: EIP1193DATA;
	};

export type EIP1193TransactionEIP1193DATA =
	| EIP1193NormalTransactionEIP1193DATA
	| EIP1193TransactionContractCreationEIP1193DATA;

export type EIP1193CallParam = {
	from?: EIP1193Account;
	to: EIP1193Account;
	gas?: EIP1193QUANTITY;
	gasPrice?: EIP1193QUANTITY;
	value?: EIP1193QUANTITY;
	data?: EIP1193DATA;
};

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

export type EIP1193LogsParam = {
	fromBlock?: EIP1193BlockTag;
	toBlock?: EIP1193BlockTag;
	address?: EIP1193Account | EIP1193Accounts;
	topics?: (EIP1193DATA | EIP1193DATA[])[];
	blockhash?: EIP1193DATA;
};

export type EIP1193TypedSignatureParam = { [field: string]: any }; // TODO
// ------------------------------------------------------------------------------------------------
// REQUEST TYPES
// ------------------------------------------------------------------------------------------------

export type EIP1193Web3ClientVersionRequest = {
	readonly method: "web3_clientVersion";
};

export type EIP1193Web3SHARequest = {
	readonly method: "web3_sha";
	readonly params: [EIP1193DATA];
};

export type EIP1193NetVersionRequest = {
	readonly method: "net_version";
};

export type EIP1193NetListeningRequest = {
	readonly method: "net_listening";
};

export type EIP1193NetPeerCountRequest = {
	readonly method: "net_peerCount";
};

export type EIP1193ProtocolVersionRequest = {
	readonly method: "eth_protocolVersion";
};

export type EIP1193SyncingRequest = {
	readonly method: "eth_syncing";
};

export type EIP1193CoinbaseRequest = {
	readonly method: "eth_coinbase";
};

export type EIP1193MiningRequest = {
	readonly method: "eth_mining";
};

export type EIP1193HashrateRequest = {
	readonly method: "eth_hashrate";
};

export type EIP1193GasPriceRequest = {
	readonly method: "eth_gasPrice";
};

export type EIP1193AccountsRequest = {
	readonly method: "eth_accounts";
};

export type EIP1193BlockNumberRequest = {
	readonly method: "eth_blockNumber";
};

export type EIP1193GetBalanceRequest = {
	readonly method: "eth_getBalance";
	readonly params: [EIP1193Account] | [EIP1193Account, EIP1898BlockTag];
};

export type EIP1193GetStorageAtRequest = {
	readonly method: "eth_getStorageAt";
	readonly params:
		| [EIP1193Account, EIP1193QUANTITY]
		| [EIP1193Account, EIP1193QUANTITY, EIP1898BlockTag];
};

export type EIP1193GetTransactionCountRequest = {
	readonly method: "eth_getTransactionCount";
	readonly params: [EIP1193Account] | [EIP1193Account, EIP1898BlockTag];
};

export type EIP1193GetTransactionCountByHashRequest = {
	readonly method: "eth_getBlockTransactionCountByHash";
	readonly params: [EIP1193DATA];
};

export type EIP1193GetTransactionCountByNumberRequest = {
	readonly method: "eth_getBlockTransactionCountByNumber";
	readonly params: [EIP1193BlockTag];
};

export type EIP1193GetUncleCountByBlockHashRequest = {
	readonly method: "eth_getUncleCountByBlockHash";
	readonly params: [EIP1193DATA];
};

export type EIP1193GetUncleCountByBlockNumberRequest = {
	readonly method: "eth_getUncleCountByBlockNumber";
	readonly params: [EIP1193BlockTag];
};

export type EIP1193GetCodeRequest = {
	readonly method: "eth_getCode";
	readonly params: [EIP1193Account] | [EIP1193Account, EIP1898BlockTag];
};

export type EIP1193LegacySignRequest = {
	readonly method: "eth_sign";
	readonly params: [EIP1193Account, EIP1193DATA];
};

export type EIP1193SignTransactionRequest = {
	readonly method: "eth_signTransaction";
	readonly params: [EIP1193TransactionData];
};

export type EIP1193SendTransactionRequest = {
	readonly method: "eth_sendTransaction";
	readonly params: [EIP1193TransactionData];
};

export type EIP1193SendRawTransactionRequest = {
	readonly method: "eth_sendRawTransaction";
	readonly params: [EIP1193DATA];
};

export type EIP119CallRequest = {
	readonly method: "eth_call";
	readonly params: [EIP1193CallParam] | [EIP1193CallParam, EIP1898BlockTag];
};

export type EIP119EstimateGasRequest = {
	readonly method: "eth_estimateGas";
	readonly params: [EIP1193CallParam] | [EIP1193CallParam, EIP1193BlockTag]; // EIP1898BlockTag ?
};

export type EIP119GetBlockByHashRequest<T extends boolean = false> = {
	readonly method: "eth_getBlockByHash";
	readonly params: [EIP1193DATA, T];
};

export type EIP119GetBlockByNumberRequest<T = false> = {
	readonly method: "eth_getBlockByNumber";
	readonly params: [EIP1193BlockTag, T];
};

export type EIP119GetTransactionByHashRequest = {
	readonly method: "eth_getTransactionByHash";
	readonly params: [EIP1193DATA];
};

export type EIP119GetTransactionByBlockHashAndIndexRequest = {
	readonly method: "eth_getTransactionByBlockHashAndIndex";
	readonly params: [EIP1193DATA, EIP1193QUANTITY];
};

export type EIP119GetTransactionByBlockNumberAndIndexRequest = {
	readonly method: "eth_getTransactionByBlockNumberAndIndex";
	readonly params: [EIP1193BlockTag, EIP1193QUANTITY];
};

export type EIP119GetTransactionReceiptRequest = {
	readonly method: "eth_getTransactionReceipt";
	readonly params: [EIP1193DATA];
};

export type EIP119GetUncleByBlockHashAndIndexRequest = {
	readonly method: "eth_getUncleByBlockHashAndIndex";
	readonly params: [EIP1193DATA, EIP1193QUANTITY];
};

export type EIP119GetUncleByBlockNumberAndIndexRequest = {
	readonly method: "eth_getUncleByBlockNumberAndIndex";
	readonly params: [EIP1193BlockTag, EIP1193QUANTITY];
};

export type EIP119GetLogsRequest = {
	readonly method: "eth_getLogs";
	readonly params: [EIP1193LogsParam];
};

// ------------------------------------------------------------------------------------------------
// MORE REQUEST TYPES
// ------------------------------------------------------------------------------------------------

export type EIP1193PersonalSignRequest = {
	readonly method: "personal_sign";
	readonly params: [EIP1193DATA, EIP1193Account];
};

export type EIP1193PTypedSignv4Request = {
	readonly method: "eth_signTypedData_v4";
	readonly params: [EIP1193Account, EIP1193TypedSignatureParam];
};

export type EIP1193PTypedSignRequest = {
	readonly method: "eth_signTypedData";
	readonly params: [EIP1193Account, EIP1193TypedSignatureParam];
};

export type EIP1193ChainIdRequest = {
	readonly method: "eth_chainId";
};

export type EIP1193RequestAccountsRequest = {
	readonly method: "eth_requestAccounts";
};

export type ERIP1193SwitchChainRequest = {
	readonly method: "wallet_switchEthereumChain";
	readonly params: [
		{
			chainId: EIP1193ChainId;
		}
	];
};
export type ERIP1193AddChainRequest = {
	readonly method: "wallet_addEthereumChain";
	readonly params: [EIP1193AddChainParam];
};

export type EIP1193OtherSubscribeRequest = {
	readonly method: "eth_subscribe";
	readonly params: ["newHeads" | "newPendingTransactions" | "syncing"];
};

export type EIP1193LogsSubscribeRequest = {
	readonly method: "eth_subscribe";
	readonly params: [
		"logs",
		{
			address: EIP1193Account | EIP1193Account[];
			topics: (EIP1193DATA[] | EIP1193DATA)[];
		}
	];
};

export type EIP1193SubscribeRequest =
	| EIP1193LogsSubscribeRequest
	| EIP1193OtherSubscribeRequest;

export type EIP1193UnsubscribeRequest = {
	readonly method: "eth_unsubscribe";
	readonly params: [EIP1193DATA];
};

export type EIP1193GetProofRequest = {
	readonly method: "eth_getProof";
	readonly params:
		| [EIP1193DATA, EIP1193DATA[]]
		| [EIP1193DATA, EIP1193DATA[], EIP1898BlockTag];
};

// ------------------------------------------------------------------------------------------------

export type EIP1193Request =
	| EIP1193Web3ClientVersionRequest
	| EIP1193Web3SHARequest
	| EIP1193NetVersionRequest
	| EIP1193NetListeningRequest
	| EIP1193NetPeerCountRequest
	| EIP1193ProtocolVersionRequest
	| EIP1193SyncingRequest
	| EIP1193CoinbaseRequest
	| EIP1193MiningRequest
	| EIP1193HashrateRequest
	| EIP1193AccountsRequest
	| EIP1193BlockNumberRequest
	| EIP1193GetBalanceRequest
	| EIP1193GetStorageAtRequest
	| EIP1193GetTransactionCountRequest
	| EIP1193GetTransactionCountByHashRequest
	| EIP1193GetTransactionCountByNumberRequest
	| EIP1193GetUncleCountByBlockHashRequest
	| EIP1193GetUncleCountByBlockNumberRequest
	| EIP1193GetCodeRequest
	| EIP1193LegacySignRequest
	| EIP1193SignTransactionRequest
	| EIP1193SendTransactionRequest
	| EIP1193SendRawTransactionRequest
	| EIP119CallRequest
	| EIP119EstimateGasRequest
	| EIP119GetBlockByHashRequest<false>
	| EIP119GetBlockByNumberRequest<false>
	| EIP119GetBlockByHashRequest<true>
	| EIP119GetBlockByNumberRequest<true>
	| EIP119GetTransactionByHashRequest
	| EIP119GetTransactionByBlockHashAndIndexRequest
	| EIP119GetTransactionByBlockNumberAndIndexRequest
	| EIP119GetTransactionReceiptRequest
	| EIP119GetUncleByBlockHashAndIndexRequest
	| EIP119GetUncleByBlockNumberAndIndexRequest
	| EIP119GetLogsRequest
	| EIP1193PersonalSignRequest
	| EIP1193PTypedSignv4Request
	| EIP1193PTypedSignRequest
	| EIP1193ChainIdRequest
	| EIP1193RequestAccountsRequest
	| ERIP1193SwitchChainRequest
	| ERIP1193AddChainRequest
	| EIP1193SubscribeRequest
	| EIP1193UnsubscribeRequest
	| EIP1193GasPriceRequest;

export type EIP1193Response =
	| EIP1193ChainId
	| EIP1193SyncingStatus | false
	| EIP1193QUANTITY
	| EIP1193BlockWithTransactions
	| EIP1193Transaction | null
	| EIP1193TransactionReceipt | null
	| EIP1193Block | null
	| EIP1193Log[]
	| EIP1193DATA
	| EIP1193ChainId
	| EIP1193Accounts
	| EIP1193SwitchChainError
	| EIP1193AddChainError
	| string
	| boolean;

export type EIP1193GenericRequest = {
	method: string;
	params?: any[];
};

export interface EIP1193ProviderRpcError extends Error {
	message: string;
	code: number;
	data?: unknown;
}

export interface EIP1193ConnectInfoMessage {
	readonly chainId: EIP1193ChainId;
}

export type EIP1193UnknownMessage = {
	readonly type: string;
	readonly data: unknown;
};

export type EIP1193UnknownSubscriptionMessage = EIP1193UnknownMessage & {
	readonly type: "eth_subscription";
	readonly data: {
		readonly subscription: EIP1193DATA;
		readonly result: unknown;
	};
};

export type EIP1193KnownSubscriptionMessage = EIP1193UnknownMessage & {
	readonly type: "eth_subscription";
	readonly data: {
		readonly subscription: EIP1193DATA;
		readonly result:
			| EIP1193Log
			| EIP1193Block
			| EIP1193DATA // transaction hash
			| {
					syncing: boolean;
					status: {
						startingBlock: number;
						currentBlock: number;
						highestBlock: number;
						pulledStates: number;
						knownStates: number;
					};
			  };
	};
};

export type EIP1193SubscriptionMessage =
	| EIP1193KnownSubscriptionMessage
	| EIP1193UnknownSubscriptionMessage;

export type EIP1193Message = EIP1193SubscriptionMessage | EIP1193UnknownMessage;

export type EIP1193AddChainError = {
	// TODO
};

export type EIP1193SwitchChainError = {
	// TODO
};

/*
// TODO
4001	User Rejected Request	The user rejected the request.
4100	Unauthorized	The requested method and/or account has not been authorized by the user.
4200	Unsupported Method	The Provider does not support the requested method.
4900	Disconnected	The Provider is disconnected from all chains.
4901	Chain Disconnected	The Provider is not connected to the requested chain.
*/

type Listener<Message> = (message: Message) => unknown | Promise<unknown>;

export type EIP1193ProviderWithoutEvents<T = EIP1193Request> = {
	request(args: EIP1193Web3ClientVersionRequest): Promise<string>;
	request(args: EIP1193Web3SHARequest): Promise<EIP1193DATA>;
	request(args: EIP1193NetVersionRequest): Promise<EIP1193ChainId>;
	request(args: EIP1193NetListeningRequest): Promise<boolean>;
	request(args: EIP1193NetPeerCountRequest): Promise<EIP1193QUANTITY>;
	request(args: EIP1193ProtocolVersionRequest): Promise<string>;
	request(args: EIP1193SyncingRequest): Promise<EIP1193SyncingStatus | false>;
	request(args: EIP1193CoinbaseRequest): Promise<EIP1193Account>;
	request(args: EIP1193GasPriceRequest): Promise<EIP1193QUANTITY>;
	request(args: EIP1193AccountsRequest): Promise<EIP1193Accounts>;
	request(args: EIP1193BlockNumberRequest): Promise<EIP1193QUANTITY>;
	request(args: EIP1193GetBalanceRequest): Promise<EIP1193QUANTITY>;
	request(args: EIP1193GetStorageAtRequest): Promise<EIP1193DATA>;
	request(args: EIP1193GetTransactionCountRequest): Promise<EIP1193QUANTITY>;
	request(
		args: EIP1193GetTransactionCountByHashRequest
	): Promise<EIP1193QUANTITY>;
	request(
		args: EIP1193GetTransactionCountByNumberRequest
	): Promise<EIP1193QUANTITY>;

	request(
		args: EIP1193GetUncleCountByBlockHashRequest
	): Promise<EIP1193QUANTITY>;
	request(
		args: EIP1193GetUncleCountByBlockNumberRequest
	): Promise<EIP1193QUANTITY>;
	request(args: EIP1193GetCodeRequest): Promise<EIP1193DATA>;
	request(args: EIP1193LegacySignRequest): Promise<EIP1193DATA>;
	request(args: EIP1193SignTransactionRequest): Promise<EIP1193DATA>;
	request(args: EIP1193SendTransactionRequest): Promise<EIP1193DATA>;
	request(args: EIP1193SendRawTransactionRequest): Promise<EIP1193DATA>;
	request(args: EIP119CallRequest): Promise<EIP1193DATA>;
	request(args: EIP119EstimateGasRequest): Promise<EIP1193QUANTITY>;
	request(args: EIP119GetBlockByHashRequest): Promise<EIP1193Block | null>;
	request(args: EIP119GetBlockByNumberRequest): Promise<EIP1193Block | null>;
	request(
		args: EIP119GetBlockByHashRequest<true>
	): Promise<EIP1193BlockWithTransactions | null>;
	request(
		args: EIP119GetBlockByNumberRequest<true>
	): Promise<EIP1193BlockWithTransactions | null>;
	request(args: EIP119GetTransactionByHashRequest): Promise<EIP1193Transaction | null>;
	request(
		args: EIP119GetTransactionByBlockHashAndIndexRequest
	): Promise<EIP1193Transaction | null>;
	request(
		args: EIP119GetTransactionByBlockNumberAndIndexRequest
	): Promise<EIP1193Transaction | null>;
	request(
		args: EIP119GetTransactionReceiptRequest
	): Promise<EIP1193TransactionReceipt | null>;
	request(
		args: EIP119GetUncleByBlockHashAndIndexRequest
	): Promise<EIP1193Block | null>;
	request(
		args: EIP119GetUncleByBlockNumberAndIndexRequest
	): Promise<EIP1193Block | null>;
	request(args: EIP119GetLogsRequest): Promise<EIP1193Log[]>;
	request(args: EIP1193PersonalSignRequest): Promise<EIP1193DATA>;
	request(args: EIP1193PTypedSignv4Request): Promise<EIP1193DATA>;
	request(args: EIP1193PTypedSignRequest): Promise<EIP1193DATA>;
	request(args: EIP1193ChainIdRequest): Promise<EIP1193ChainId>;
	request(args: EIP1193RequestAccountsRequest): Promise<EIP1193Accounts>;
	request(
		args: ERIP1193SwitchChainRequest
	): Promise<EIP1193SwitchChainError | null>;
	request(args: ERIP1193AddChainRequest): Promise<EIP1193AddChainError | null>;
	request(args: EIP1193SubscribeRequest): Promise<string>;
	request(args: EIP1193UnsubscribeRequest): Promise<boolean>;

	request(args: T): Promise<unknown>;
	// request(args: EIP1193GenericRequest): Promise<unknown>;
};

export type EIP119DebugTraceTransactionRequest = {
	readonly method: "debug_traceTransaction";
	readonly params: [EIP1193DATA];
};

export type EIP1193TracedTransaction = {
	failed: boolean;
	gas: EIP1193QUANTITY;
	returnValue: EIP1193DATA;
	structLogs: any[]; // TODO
	// TODO more
}

export type EIP1193ProviderExtraMethods = {
	request(args: EIP119DebugTraceTransactionRequest): Promise<EIP1193TracedTransaction>;
};

// export interface EIP1193ProviderWithBasicEvents<T = EIP1193Request>
// 	extends BareEIP1193Provider<T> {
// 	on(
// 		eventName: "disconnect",
// 		listener: Listener<EIP1193ProviderRpcError>
// 	): this;
// 	on(eventName: "accountsChanged", listener: Listener<EIP1193Account[]>): this;
// 	on(eventName: "chainChanged", listener: Listener<EIP1193ChainId>): this;
// 	on(eventName: "connect", listener: Listener<EIP1193ConnectInfoMessage>): this;

// 	removeListener(
// 		eventName: "disconnect",
// 		listener: Listener<EIP1193ProviderRpcError>
// 	): this;
// 	removeListener(
// 		eventName: "accountsChanged",
// 		listener: Listener<EIP1193Account[]>
// 	): this;
// 	removeListener(
// 		eventName: "chainChanged",
// 		listener: Listener<EIP1193ChainId>
// 	): this;
// 	removeListener(
// 		eventName: "connect",
// 		listener: Listener<EIP1193ConnectInfoMessage>
// 	): this;
// }

export interface EIP1193Provider<T = EIP1193Request>
	extends EIP1193ProviderWithoutEvents<T> {
	on(eventName: "message", listener: Listener<EIP1193Message>): this;
	on(
		eventName: "disconnect",
		listener: Listener<EIP1193ProviderRpcError>
	): this;
	on(eventName: "accountsChanged", listener: Listener<EIP1193Account[]>): this;
	on(eventName: "chainChanged", listener: Listener<EIP1193ChainId>): this;
	on(eventName: "connect", listener: Listener<EIP1193ConnectInfoMessage>): this;
	removeListener(
		eventName: "message",
		listener: Listener<EIP1193Message>
	): this;
	removeListener(
		eventName: "disconnect",
		listener: Listener<EIP1193ProviderRpcError>
	): this;
	removeListener(
		eventName: "accountsChanged",
		listener: Listener<EIP1193Account[]>
	): this;
	removeListener(
		eventName: "chainChanged",
		listener: Listener<EIP1193ChainId>
	): this;
	removeListener(
		eventName: "connect",
		listener: Listener<EIP1193ConnectInfoMessage>
	): this;
	// removeListener(
	// 	eventName: string | symbol,
	// 	listener: Listener<unknown>
	// ): this;
}

export type EIP1193DATA = `0x${string}`;
export type EIP1193BlockTag =
	| EIP1193QUANTITY
	| "latest"
	| "earliest"
	| "pending"
	| "safe"
	| "finalized";

export type EIP1898BlockTag =
	| EIP1193QUANTITY
	| "latest"
	| "earliest"
	| "pending"
	| "safe"
	| "finalized"
	| { blockHash: EIP1193QUANTITY; requireCanonical?: boolean } // EIP-1898
	| { blockNumber: EIP1193QUANTITY }; // EIP-1898

export type EIP1193QUANTITY = `0x${string}`;
export type EIP1193ChainId = `0x${string}`;
export type EIP1193Account = `0x${string}`;
export type EIP1193Accounts = EIP1193Account[];
