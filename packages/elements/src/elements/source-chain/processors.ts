import {
	extractEntry,
	getEntryTypeString, //@ts-ignore
} from '@holochain-playground/simulator';
import {
	Create,
	Entry,
	NewEntryAction,
	Record,
	SignedActionHashed,
	encodeHashToBase64,
} from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { CellStore } from '../../store/playground-store.js';
import { SimulatedCellStore } from '../../store/simulated-playground-store.js';

export function sourceChainNodes(cellStore: CellStore, records: Record[]) {
	const nodes = [];

	for (const record of records) {
		const action: SignedActionHashed = record.signed_action;
		const actionHash = encodeHashToBase64(action.hashed.hash);

		//@ts-ignore
		nodes.push({
			data: {
				id: actionHash,
				data: action,
				label: action.hashed.content.type,
			},
			classes: ['action', action.hashed.content.type],
		});

		if ((action.hashed.content as Create).prev_action) {
			const previousActionHash = encodeHashToBase64(
				(action.hashed.content as Create).prev_action,
			);
			//@ts-ignore
			nodes.push({
				data: {
					id: `${actionHash}->${previousActionHash}`,
					source: actionHash,
					target: previousActionHash,
				},
				classes: ['embedded-reference'],
			});
		}
	}

	for (const record of records) {
		const action: SignedActionHashed = record.signed_action;
		const actionHash = encodeHashToBase64(action.hashed.hash);

		if (extractEntry(record)) {
			const newEntryAction = action.hashed.content as NewEntryAction;
			const entryHash = encodeHashToBase64(newEntryAction.entry_hash);
			const entryNodeId = `${actionHash}:${entryHash}`;

			const entry: Entry = (record.entry as any)?.Present;

			let entryType: string | undefined;

			if (cellStore instanceof SimulatedCellStore) {
				entryType = getEntryTypeString(
					cellStore.dna,
					newEntryAction.entry_type,
				);
			} else {
				entryType = entry.entry_type as string;
			}

			let data = entry;

			if (entry.entry_type === 'App') {
				data = {
					...data,
					entry: decode(entry.entry) as any,
				};
			}

			//@ts-ignore
			nodes.push({
				data: {
					id: entryNodeId,
					data,
					label: entryType,
				},
				classes: [entryType, 'entry'],
			});
			//@ts-ignore
			nodes.push({
				data: {
					id: `${actionHash}->${entryNodeId}`,
					source: actionHash,
					target: entryNodeId,
				},
				classes: ['embedded-reference'],
			});
		}
	}

	return nodes;
}
