import axios from "axios";
import { IIPFSStoreRequest } from "../models/api/IIPFSStoreRequest";
import { IIPFSStoreResponse } from "../models/api/IIPFSStoreResponse";

/**
 * Class to handle api communications.
 */
export class ApiClient {
    /**
     * The endpoint for performing communications.
     */
    private readonly _endpoint: string;

    /**
     * Create a new instance of ApiClient.
     * @param endpoint The endpoint for the api.
     */
    constructor(endpoint: string) {
        this._endpoint = endpoint;

        if (window.location.hostname === "localhost") {
            this._endpoint = "http://localhost:4000";
        }
    }

    /**
     * Perform a request to upload a file.
     * @param request The request to send.
     * @returns The response from the request.
     */
    public async uploadFile(request: IIPFSStoreRequest): Promise<IIPFSStoreResponse> {
        const ax = axios.create({ baseURL: this._endpoint });
        let response: IIPFSStoreResponse;

        try {
            const axiosResponse = await ax.post<IIPFSStoreResponse>(`ipfs`, request);

            response = axiosResponse.data;
        } catch (err) {
            response = {
                success: false,
                message: `There was a problem communicating with the API.\n${err}`
            };
        }

        return response;
    }
}