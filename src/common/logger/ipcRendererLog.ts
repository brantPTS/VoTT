import * as shortid from "shortid";
import { IpcProxyMessage } from "../../electron/common/ipcProxy";
import { Deferred } from "../deferred";

export class IpcRendererLog {

    public static pending: { [id: string]: Deferred<any> } = {};

    public static initialize() {
        if (IpcRendererLog.initialized) {
            return;
        }
        IpcRendererLog.ipcRenderer = (window as any).require("electron").ipcRenderer;
        IpcRendererLog.ipcRenderer.on("ipc-renderer-log", (sender, message: IpcProxyMessage<any>) => {
            const deferred = IpcRendererLog.pending[message.id];
            if (!deferred) {
                throw new Error(`Cannot find deferred with id '${message.id}'`);
            }

            if (message.error) {
                deferred.reject(message.error);
            } else {
                deferred.resolve(message.result);
            }

            delete IpcRendererLog.pending[message.id];
        });

        IpcRendererLog.initialized = true;
    }

    public static send<TResult, TArgs>(type: string, args?: TArgs): Promise<TResult> {
        IpcRendererLog.initialize();
        const id = shortid.generate();
        const deferred = new Deferred<TResult>();
        IpcRendererLog.pending[id] = deferred;

        const outgoingArgs: IpcProxyMessage<TArgs> = {
            id,
            type,
            args,
        };

        console.log(`LOG: ${type}`,outgoingArgs)

        IpcRendererLog.ipcRenderer.send("ipc-main-log", outgoingArgs);

        return deferred.promise;
    }
    private static ipcRenderer;
    private static initialized: boolean = false;
}
