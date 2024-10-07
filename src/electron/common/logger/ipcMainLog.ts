import { BrowserWindow, IpcMain } from "electron";
import { IpcProxyMessage } from "../ipcProxy";
import log from './logger.main';

export type IpcLogHandler<T> = (sender: any, args: T) => any;

export class IpcMainLog {
    private static PROXY_EVENT_NAME: string = "ipc-renderer-log";

    public handlers: { [type: string]: IpcLogHandler<any> } = {};

    constructor(private ipcMain: IpcMain, private browserWindow: BrowserWindow) {
        this.init();
    }

    public register<T>(type: string, handler: IpcLogHandler<T>) {
        log.info(`Registered IpcMainLog Handler for TYPE ${type}`)
        this.handlers[type] = handler;
    }

    public registerProxy(proxyPrefix, provider) {
        Object.getOwnPropertyNames(provider.__proto__).forEach((memberName) => {
            if (typeof (provider[memberName]) === "function") {
                this.register(`${proxyPrefix}:${memberName}`, (sender: any, eventArgs: any[]) => {
                    return provider[memberName].apply(provider, eventArgs);
                });
            }
        });
    }

    private init() {
        this.ipcMain.on("ipc-main-log", (sender: any, message: IpcProxyMessage<any>) => {
          
            const handler = this.handlers[message.type];
            if (!handler) {
                console.log(`No IPC proxy handler defined for event type '${message.type}'`);
            }
            const returnArgs: IpcProxyMessage<any> = {
                id: message.id,
                type: message.type,
            };

            try {
                returnArgs.debug = JSON.stringify(message.args);
                const handlerValue = handler(sender, message.args);
                if (handlerValue && handlerValue.then) {
                    handlerValue
                        .then((result) => {
                            returnArgs.result = result;
                            this.browserWindow.webContents.send(IpcMainLog.PROXY_EVENT_NAME, returnArgs);
                        })
                        .catch((err) => {
                            returnArgs.error = err;
                            this.browserWindow.webContents.send(IpcMainLog.PROXY_EVENT_NAME, returnArgs);
                        });
                } else {
                    returnArgs.result = handlerValue;
                    this.browserWindow.webContents.send(IpcMainLog.PROXY_EVENT_NAME, returnArgs);
                }
            } catch (err) {
                returnArgs.error = err;
                this.browserWindow.webContents.send(IpcMainLog.PROXY_EVENT_NAME, returnArgs);
            }
        });
    }
}
