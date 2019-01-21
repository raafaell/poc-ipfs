import { composeAPI, generateAddress } from "@iota/core";
import crypto from "crypto";
import ipfsClient from "ipfs-http-client";
import { IIPFSStoreRequest } from "../models/api/IIPFSStoreRequest";
import { IIPFSStoreResponse } from "../models/api/IIPFSStoreResponse";
import { IConfiguration } from "../models/IConfiguration";
import { IPayload } from "../models/tangle/IPayload";
import { TrytesHelper } from "../utils/trytesHelper";

/**
 * Ipfs store command.
 */
export async function ipfsStore(config: IConfiguration, request: IIPFSStoreRequest): Promise<IIPFSStoreResponse> {
    try {
        const maxSize = 10240;

        const buffer = Buffer.from(request.data, "base64");

        if (buffer.length >= maxSize) {
            throw new Error(`The file is too large for this demonstration, it should be less than ${maxSize} bytes.`);
        }

        if (buffer.length === 0) {
            throw new Error(`The file must be greater than 0 bytes in length.`);
        }

        const sha256 = crypto.createHash("sha256");
        sha256.update(buffer);
        const hex = sha256.digest("hex");

        if (hex !== request.sha256) {
            throw new Error(`The sha256 for the file is incorrect '${request.sha256}' was sent but it has been calculated as '${hex}'`);
        }

        const ipfs = ipfsClient(config.ipfs);
        const addResponse = await ipfs.add(buffer);

        const iota: any = composeAPI({
            provider: config.provider
        });

        const nextAddress = generateAddress(config.seed, 0, 2);

        const tanglePayload: IPayload = {
            name: request.name,
            description: request.description,
            size: request.size,
            modified: request.modified,
            sha256: request.sha256,
            ipfs: addResponse[0].hash
        };

        const trytes = await iota.prepareTransfers(
            "9".repeat(81),
            [
                {
                    address: nextAddress,
                    value: 0,
                    message: TrytesHelper.toTrytes(tanglePayload)
                }
            ]);

        const bundles = await iota.sendTrytes(trytes, 3, 14);

        return {
            success: true,
            message: "OK",
            transactionHash: bundles[0].hash,
            ipfsHash: tanglePayload.ipfs
        };
    } catch (err) {
        return {
            success: false,
            message: err.toString()
        };
    }
}